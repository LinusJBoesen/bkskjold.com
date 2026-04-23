import { Hono } from "hono";
import { sql } from "../lib/db";
import { fetchMatchResults, scrapeMatchInfo, type DbuMatchInfo } from "../services/dbu";
import { requireRole } from "../middleware/auth";
import { buildPlayerLookup, matchDbuName } from "../services/dbu-name-map";

const analysis = new Hono();

interface DbuInfoRow {
  dbu_match_id: string;
  home_lineup: string | null;
  away_lineup: string | null;
  goal_events: string | null;
}

async function loadMatchInfoRows(ids: string[]): Promise<Map<string, DbuInfoRow>> {
  if (ids.length === 0) return new Map();
  // Lazy-add the column in case the startup migration hasn't run yet on this DB.
  await sql.unsafe(`ALTER TABLE dbu_match_info ADD COLUMN IF NOT EXISTS goal_events TEXT`).catch(() => {});
  const rows: DbuInfoRow[] = [];
  for (const id of ids) {
    const [row] = (await sql`
      SELECT dbu_match_id, home_lineup, away_lineup, goal_events
      FROM dbu_match_info
      WHERE dbu_match_id = ${id}
    `) as DbuInfoRow[];
    if (row) rows.push(row);
  }
  return new Map(rows.map((r) => [r.dbu_match_id, r]));
}

async function persistScrapedInfo(dbuMatchId: string, info: DbuMatchInfo) {
  await sql`
    INSERT INTO dbu_match_info (
      dbu_match_id, referee, venue_name, venue_address, pitch,
      home_lineup, away_lineup, home_officials, away_officials, goal_scorers, goal_events
    )
    VALUES (
      ${dbuMatchId}, ${info.referee}, ${info.venueName}, ${info.venueAddress}, ${info.pitch},
      ${JSON.stringify(info.homeLineup)}, ${JSON.stringify(info.awayLineup)},
      ${JSON.stringify(info.homeOfficials)}, ${JSON.stringify(info.awayOfficials)},
      ${JSON.stringify(info.goalScorers)}, ${JSON.stringify(info.goalEvents)}
    )
    ON CONFLICT (dbu_match_id) DO UPDATE SET
      referee = EXCLUDED.referee,
      venue_name = EXCLUDED.venue_name,
      venue_address = EXCLUDED.venue_address,
      pitch = EXCLUDED.pitch,
      home_lineup = EXCLUDED.home_lineup,
      away_lineup = EXCLUDED.away_lineup,
      home_officials = EXCLUDED.home_officials,
      away_officials = EXCLUDED.away_officials,
      goal_scorers = EXCLUDED.goal_scorers,
      goal_events = EXCLUDED.goal_events,
      synced_at = NOW()
  `;
}

// Cross-reference DBU matches with Spond attendance to get player-level match stats (admin + spiller)
analysis.get("/player-rates", requireRole("admin", "spiller"), async (c) => {
  const dbuMatches = await fetchMatchResults();
  const ourTeamId = process.env.DBU_TEAM_ID;

  // fetchMatchResults is already filtered to our team_id. Drop rows with no
  // score yet (upcoming). Determine isHome via homeTeamId match.
  const playedMatches = dbuMatches.filter(
    (m) => m.homeScore !== null && m.awayScore !== null
  );

  const matchResults = playedMatches.map((m) => {
    const isHome = ourTeamId ? m.homeTeamId === ourTeamId : false;
    let result: "win" | "draw" | "loss" = "draw";
    if (m.homeScore !== null && m.awayScore !== null) {
      if (m.homeScore > m.awayScore) result = isHome ? "win" : "loss";
      else if (m.homeScore < m.awayScore) result = isHome ? "loss" : "win";
    }
    const opponent = isHome ? m.awayTeam : m.homeTeam;
    const score = `${m.homeScore ?? "?"}-${m.awayScore ?? "?"}`;
    return { date: m.date, opponent, result, score, isHome, dbuMatchId: m.dbuMatchId ?? null };
  });

  // Get all active players with their attendance at Spond events near match dates
  const players = await sql`
    SELECT id, display_name, first_name, last_name, profile_picture
    FROM players WHERE active = 1 ORDER BY display_name
  ` as {
    id: string;
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    profile_picture: string | null;
  }[];

  // --- DBU-sourced per-player stats (matches, W/L, goals, assists) --------
  // Best-effort: if any step fails (scrape, DB, name mapping), we still return
  // the rest of the analysis payload rather than 500ing the whole page.
  let dbuPlayerStats: {
    id: string;
    displayName: string;
    profilePicture: string | null;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    assists: number;
  }[] = [];
  let dbuUnmappedNames: string[] = [];

  try {
    const playedIds = playedMatches
      .map((m) => m.dbuMatchId)
      .filter((id): id is string => !!id);

    let infoMap = await loadMatchInfoRows(playedIds);
    // Re-scrape rows that are missing OR have empty lineups/goal_events. Earlier
    // versions of the scraper persisted rows with null lineups, so we must
    // refresh those too to backfill with current scraper output.
    const needsScrape = playedIds.filter((id) => {
      const row = infoMap.get(id);
      if (!row) return true;
      const home = row.home_lineup ? (JSON.parse(row.home_lineup) as unknown[]) : [];
      const away = row.away_lineup ? (JSON.parse(row.away_lineup) as unknown[]) : [];
      if (home.length === 0 && away.length === 0) return true;
      if (!row.goal_events) return true;
      return false;
    });
    if (needsScrape.length) {
      console.log(`[analysis] scraping ${needsScrape.length} DBU match(es): ${needsScrape.join(", ")}`);
      for (const id of needsScrape) {
        try {
          const info = await scrapeMatchInfo(id, { forceRefresh: true });
          await persistScrapedInfo(id, info);
        } catch (err) {
          console.error(`[analysis] scrapeMatchInfo(${id}) failed:`, err);
        }
      }
      infoMap = await loadMatchInfoRows(playedIds);
    }

    const lookup = buildPlayerLookup(players);

    type Agg = {
      matches: number;
      wins: number;
      draws: number;
      losses: number;
      goals: number;
      assists: number;
    };
    const agg = new Map<string, Agg>();
    const ensure = (pid: string) => {
      let a = agg.get(pid);
      if (!a) {
        a = { matches: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0 };
        agg.set(pid, a);
      }
      return a;
    };

    const unmapped = new Set<string>();

    for (const m of matchResults) {
      if (!m.dbuMatchId) continue;
      const row = infoMap.get(m.dbuMatchId);
      if (!row) continue;
      const ourLineupRaw = m.isHome ? row.home_lineup : row.away_lineup;
      const ourLineup: string[] = ourLineupRaw ? JSON.parse(ourLineupRaw) : [];
      const events: { scorer: string; assist: string | null; team: "home" | "away" }[] =
        row.goal_events ? JSON.parse(row.goal_events) : [];
      const ourSide: "home" | "away" = m.isHome ? "home" : "away";

      for (const name of ourLineup) {
        const pid = matchDbuName(name, lookup);
        if (!pid) {
          unmapped.add(name);
          continue;
        }
        const a = ensure(pid);
        a.matches += 1;
        if (m.result === "win") a.wins += 1;
        else if (m.result === "draw") a.draws += 1;
        else a.losses += 1;
      }

      for (const ev of events) {
        if (ev.team !== ourSide) continue;
        const scorerId = matchDbuName(ev.scorer, lookup);
        if (scorerId) ensure(scorerId).goals += 1;
        else unmapped.add(ev.scorer);
        if (ev.assist) {
          const assistId = matchDbuName(ev.assist, lookup);
          if (assistId) ensure(assistId).assists += 1;
          else unmapped.add(ev.assist);
        }
      }
    }

    dbuPlayerStats = players.map((p) => {
      const a = agg.get(p.id);
      return {
        id: p.id,
        displayName: p.display_name,
        profilePicture: p.profile_picture || null,
        matches: a?.matches ?? 0,
        wins: a?.wins ?? 0,
        draws: a?.draws ?? 0,
        losses: a?.losses ?? 0,
        goals: a?.goals ?? 0,
        assists: a?.assists ?? 0,
      };
    });
    dbuUnmappedNames = [...unmapped].sort();
  } catch (err) {
    console.error("[analysis] DBU player stats failed:", err);
  }

  // Calculate per-player stats from match events
  const eventStatsRows = await sql`
    SELECT
      p.id,
      p.display_name,
      p.profile_picture,
      COALESCE(SUM(CASE WHEN me.event_type = 'goal' THEN 1 ELSE 0 END), 0) as goals,
      COALESCE(SUM(CASE WHEN me.event_type = 'assist' THEN 1 ELSE 0 END), 0) as assists,
      COALESCE(SUM(CASE WHEN me.event_type = 'clean_sheet' THEN 1 ELSE 0 END), 0) as clean_sheets,
      COALESCE(SUM(CASE WHEN me.event_type = 'yellow_card' THEN 1 ELSE 0 END), 0) as yellow_cards,
      COALESCE(SUM(CASE WHEN me.event_type = 'red_card' THEN 1 ELSE 0 END), 0) as red_cards
    FROM players p
    LEFT JOIN match_events me ON me.player_id = p.id
    WHERE p.active = 1
    GROUP BY p.id, p.display_name, p.profile_picture
    ORDER BY goals DESC, assists DESC, p.display_name
  ` as {
    id: string;
    display_name: string;
    profile_picture: string | null;
    goals: number;
    assists: number;
    clean_sheets: number;
    yellow_cards: number;
    red_cards: number;
  }[];

  const playerStats = eventStatsRows.map((s) => ({
    id: s.id,
    displayName: s.display_name,
    profilePicture: s.profile_picture || null,
    goals: Number(s.goals),
    assists: Number(s.assists),
    cleanSheets: Number(s.clean_sheets),
    yellowCards: Number(s.yellow_cards),
    redCards: Number(s.red_cards),
  }));

  return c.json({
    dbuMatches: matchResults,
    dbuSummary: {
      total: matchResults.length,
      wins: matchResults.filter((m) => m.result === "win").length,
      draws: matchResults.filter((m) => m.result === "draw").length,
      losses: matchResults.filter((m) => m.result === "loss").length,
    },
    playerStats,
    dbuPlayerStats,
    dbuUnmappedNames,
  });
});

export default analysis;
