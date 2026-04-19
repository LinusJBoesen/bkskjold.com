import { Hono } from "hono";
import { sql } from "../lib/db";
import { fetchMatchResults } from "../services/dbu";
import { requireRole } from "../middleware/auth";

const analysis = new Hono();

// Cross-reference DBU matches with Spond attendance to get player-level match stats (admin + spiller)
analysis.get("/player-rates", requireRole("admin", "spiller"), async (c) => {
  const dbuMatches = await fetchMatchResults();

  // Find DBU matches involving BK Skjold
  const skjoldMatches = dbuMatches.filter(
    (m) => m.homeTeam === "BK Skjold" || m.awayTeam === "BK Skjold"
  );

  // For each match, determine result for Skjold
  const matchResults = skjoldMatches.map((m) => {
    const isHome = m.homeTeam === "BK Skjold";
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
    SELECT id, display_name FROM players WHERE active = 1 ORDER BY display_name
  ` as { id: string; display_name: string }[];

  // Get spond events (which may correspond to match days)
  const spondEvents = await sql`
    SELECT id, name, start_time, end_time, location_name, location_address FROM spond_events ORDER BY start_time DESC
  ` as { id: string; name: string; start_time: string }[];

  // Build player attendance map from spond_attendance
  const attendanceRows = await sql`
    SELECT event_id, player_id, response FROM spond_attendance
  ` as { event_id: string; player_id: string; response: string }[];

  const attendanceMap = new Map<string, Map<string, string>>();
  for (const row of attendanceRows) {
    if (!attendanceMap.has(row.event_id)) {
      attendanceMap.set(row.event_id, new Map());
    }
    attendanceMap.get(row.event_id)!.set(row.player_id, row.response);
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
  });
});

export default analysis;
