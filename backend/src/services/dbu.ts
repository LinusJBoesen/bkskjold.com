import { parse } from "node-html-parser";
import { sql } from "../lib/db";

const DBU_BASE = "https://www.dbu.dk/resultater/hold";
const DBU_MATCH_BASE = "https://www.dbu.dk/resultater/kamp";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

interface Standing {
  position: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalDiff: string;
  points: number;
}

interface DbuMatch {
  date: string;
  time: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
}

export interface DbuTeamMatch {
  dbuMatchId: string;
  date: string;
  time: string;
  homeTeam: string;
  homeTeamId: string;
  awayTeam: string;
  awayTeamId: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface DbuGoalEvent {
  scorer: string;
  assist: string | null;
  team: "home" | "away";
  minute: string | null;
}

export interface DbuMatchInfo {
  referee: string | null;
  venueName: string | null;
  venueAddress: string | null;
  pitch: string | null;
  homeLineup: string[];
  awayLineup: string[];
  homeOfficials: string[];
  awayOfficials: string[];
  goalScorers: { name: string; team: string; goals: number }[];
  goalEvents: DbuGoalEvent[];
}

let standingsCache: { data: Standing[]; timestamp: number } | null = null;
let matchesCache: { data: DbuMatch[]; timestamp: number } | null = null;
const teamMatchesCache = new Map<string, { data: DbuTeamMatch[]; timestamp: number }>();
const matchInfoCache = new Map<string, { data: DbuMatchInfo; timestamp: number }>();
const CACHE_TTL = 3600_000; // 1 hour

export async function scrapeStandings(teamId: string): Promise<Standing[]> {
  const url = `${DBU_BASE}/${teamId}/stilling`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`DBU standings fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const root = parse(html);

  const table = root.querySelector("table.sr--pool-position--table");
  if (!table) {
    throw new Error("Could not find standings table on DBU page");
  }

  const rows = table.querySelectorAll("tr");
  const standings: Standing[] = [];

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    const cells = row.querySelectorAll("td");
    if (cells.length >= 8) {
      standings.push({
        position: parseInt(cells[0]!.text.trim(), 10),
        teamName: cells[1]!.text.trim(),
        matchesPlayed: parseInt(cells[2]!.text.trim(), 10) || 0,
        wins: parseInt(cells[3]!.text.trim(), 10) || 0,
        draws: parseInt(cells[4]!.text.trim(), 10) || 0,
        losses: parseInt(cells[5]!.text.trim(), 10) || 0,
        goalDiff: cells[6]!.text.trim(),
        points: parseInt(cells[7]!.text.trim(), 10) || 0,
      });
    }
  }

  return standings;
}

export async function scrapeTeamMatches(teamId: string): Promise<DbuTeamMatch[]> {
  const cached = teamMatchesCache.get(teamId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const url = `${DBU_BASE}/${teamId}/kampprogram`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`DBU team matches fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const root = parse(html);

  const table = root.querySelector("table");
  if (!table) {
    throw new Error("Could not find match table on DBU page");
  }

  const rows = table.querySelectorAll("tr");
  const matches: DbuTeamMatch[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    const cells = row.querySelectorAll("td, th");
    if (cells.length < 7) continue;

    // cells[0] = icon with link to /resultater/kamp/{matchId}/kampinfo
    // cells[2] = date, cells[3] = time, cells[4] = home, cells[5] = away
    // cells[6] = venue, cells[7] = result

    // Extract dbu_match_id from icon link in cells[0]
    const iconLink = cells[0]?.querySelector("a");
    const iconHref = iconLink?.getAttribute("href") ?? "";
    // href like "/resultater/kamp/913776_489363/kampinfo"
    const matchIdMatch = iconHref.match(/\/resultater\/kamp\/([^/]+)/);
    const dbuMatchId = matchIdMatch?.[1] ?? "";

    const dateStr = cells[2]?.text.trim() ?? "";
    const time = cells[3]?.text.trim() ?? "";

    // Extract team names and team IDs from anchor hrefs
    const homeAnchor = cells[4]?.querySelector("a");
    const awayAnchor = cells[5]?.querySelector("a");
    const homeTeam = cells[4]?.text.trim() ?? "";
    const awayTeam = cells[5]?.text.trim() ?? "";

    // href like "/resultater/hold/460174_489363"
    const homeHref = homeAnchor?.getAttribute("href") ?? "";
    const awayHref = awayAnchor?.getAttribute("href") ?? "";
    const homeTeamId = homeHref.match(/\/resultater\/hold\/([^/]+)/)?.[1] ?? "";
    const awayTeamId = awayHref.match(/\/resultater\/hold\/([^/]+)/)?.[1] ?? "";

    const venue = cells[6]?.text.trim() ?? "";
    const resultStr = cells[7]?.text.trim() ?? "";

    if (!dateStr || !homeTeam || !awayTeam) continue;

    const isoDate = parseDbuDate(dateStr);

    let homeScore: number | null = null;
    let awayScore: number | null = null;
    if (resultStr && resultStr.includes("-")) {
      const cleaned = resultStr.replace(/\s/g, "");
      const parts = cleaned.split("-");
      if (parts.length === 2) {
        const h = parseInt(parts[0]!, 10);
        const a = parseInt(parts[1]!, 10);
        if (!isNaN(h) && !isNaN(a)) {
          homeScore = h;
          awayScore = a;
        }
      }
    }

    matches.push({
      dbuMatchId: dbuMatchId,
      date: isoDate ?? dateStr,
      time,
      homeTeam,
      homeTeamId,
      awayTeam,
      awayTeamId,
      venue,
      homeScore,
      awayScore,
    });
  }

  teamMatchesCache.set(teamId, { data: matches, timestamp: Date.now() });
  return matches;
}

/**
 * Stable synthetic key for an unplayed DBU fixture. DBU assigns a real
 * dbu_match_id only after kickoff, so upcoming matches need a deterministic
 * key that is identical regardless of which team's kampprogram produced the
 * row — otherwise we'd insert the same physical fixture once per scraped team.
 */
export function pendingMatchKey(tm: {
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: string;
  awayTeam: string;
}): string {
  const home = tm.homeTeamId || tm.homeTeam;
  const away = tm.awayTeamId || tm.awayTeam;
  return `pending_${home}_${away}_${tm.date}`;
}

/**
 * Scrape and persist every tournament team's kampprogram. Round-robin groups
 * mean our own `dbu_team_matches` rows already contain every opponent's
 * team_id, so we discover the pool without a second standings round-trip.
 * Each opponent's full fixture list is upserted under its own team_id.
 */
export async function scrapeAllTournamentMatches(
  ourTeamId: string
): Promise<{ teams: number; matches: number; errors: string[] }> {
  // Discover opponent team_ids from our own kampprogram rows.
  const rows = (await sql`
    SELECT DISTINCT home_team_id, away_team_id
    FROM dbu_team_matches
    WHERE team_id = ${ourTeamId}
  `) as { home_team_id: string | null; away_team_id: string | null }[];

  const teamIds = new Set<string>();
  for (const r of rows) {
    if (r.home_team_id && r.home_team_id !== ourTeamId) teamIds.add(r.home_team_id);
    if (r.away_team_id && r.away_team_id !== ourTeamId) teamIds.add(r.away_team_id);
  }

  let matchCount = 0;
  const errors: string[] = [];

  for (const teamId of teamIds) {
    try {
      const teamMatches = await scrapeTeamMatches(teamId);
      await sql.begin(async (tx) => {
        // Replace-on-key: refresh this team's entire kampprogram in one shot.
        await tx`DELETE FROM dbu_team_matches WHERE team_id = ${teamId}`;
        for (const tm of teamMatches) {
          const key = tm.dbuMatchId || pendingMatchKey(tm);
          await tx`
            INSERT INTO dbu_team_matches (dbu_match_id, team_id, date, time, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue)
            VALUES (${key}, ${teamId}, ${tm.date}, ${tm.time}, ${tm.homeTeam}, ${tm.homeTeamId}, ${tm.awayTeam}, ${tm.awayTeamId}, ${tm.homeScore}, ${tm.awayScore}, ${tm.venue})
            ON CONFLICT (dbu_match_id) DO UPDATE SET
              home_score = EXCLUDED.home_score,
              away_score = EXCLUDED.away_score,
              venue = EXCLUDED.venue,
              time = EXCLUDED.time,
              synced_at = NOW()
          `;
        }
      });
      matchCount += teamMatches.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${teamId}: ${msg}`);
    }
  }

  return { teams: teamIds.size, matches: matchCount, errors };
}

/**
 * Derive opponent team_id from our own cached kampprogram rows.
 * Looks up a match where opponentName appears as home or away team.
 */
export function getOpponentTeamId(
  ourMatches: DbuTeamMatch[],
  opponentName: string
): string | null {
  for (const m of ourMatches) {
    if (m.homeTeam === opponentName) return m.homeTeamId;
    if (m.awayTeam === opponentName) return m.awayTeamId;
  }
  return null;
}

function parseDbuDate(dateStr: string): string | null {
  // Format: "fre.22-08 2025" -> "2025-08-22"
  try {
    if (dateStr.includes(".") && dateStr.includes("-")) {
      const parts = dateStr.split(/\s+/);
      if (parts.length >= 2) {
        const year = parts[1];
        const datePart = parts[0]!;
        const dayMonth = datePart.split(".")[1]; // "22-08"
        if (dayMonth && dayMonth.includes("-")) {
          const [day, month] = dayMonth.split("-") as [string, string];
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      }
    }
  } catch {
    // fall through
  }
  return null;
}

export async function fetchStandings(): Promise<Standing[]> {
  if (standingsCache && Date.now() - standingsCache.timestamp < CACHE_TTL) {
    return standingsCache.data;
  }

  const rows = await sql`SELECT * FROM dbu_standings ORDER BY position ASC` as any[];

  const standings = rows.map((r) => ({
    position: r.position,
    teamName: r.team_name,
    matchesPlayed: r.matches_played,
    wins: r.wins,
    draws: r.draws,
    losses: r.losses,
    goalDiff: r.goal_diff,
    points: r.points,
  }));

  standingsCache = { data: standings, timestamp: Date.now() };
  return standings;
}

export async function fetchMatchResults(): Promise<(DbuMatch & { dbuMatchId?: string; homeTeamId?: string; awayTeamId?: string })[]> {
  if (matchesCache && Date.now() - matchesCache.timestamp < CACHE_TTL) {
    return matchesCache.data;
  }

  const teamId = process.env.DBU_TEAM_ID;

  // Prefer dbu_team_matches (single source of truth, includes time + venue).
  // Fall back to dbu_matches for legacy/test data.
  const rows = teamId
    ? (await sql`SELECT * FROM dbu_team_matches WHERE team_id = ${teamId} ORDER BY date DESC` as any[])
    : [];

  const fromTeamMatches = rows.map((r) => ({
    date: r.date,
    time: r.time ?? null,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    homeTeamId: r.home_team_id ?? undefined,
    awayTeamId: r.away_team_id ?? undefined,
    homeScore: r.home_score,
    awayScore: r.away_score,
    venue: r.venue ?? null,
    // Expose synthetic "pending_…" keys too — they let the frontend link into
    // the match-detail page for upcoming matches (no DBU id yet). The detail
    // route reads the same key from dbu_team_matches.
    dbuMatchId: r.dbu_match_id ?? undefined,
  }));

  let matches = fromTeamMatches;
  if (matches.length === 0) {
    const legacy = await sql`SELECT * FROM dbu_matches ORDER BY date DESC` as any[];
    matches = legacy.map((r) => ({
      date: r.date,
      time: r.time ?? null,
      homeTeam: r.home_team,
      awayTeam: r.away_team,
      homeTeamId: undefined,
      awayTeamId: undefined,
      homeScore: r.home_score,
      awayScore: r.away_score,
      venue: r.venue ?? null,
      dbuMatchId: r.dbu_match_id ?? undefined,
    }));
  }

  matchesCache = { data: matches, timestamp: Date.now() };
  return matches;
}

export async function scrapeMatchInfo(
  dbuMatchId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<DbuMatchInfo> {
  if (!options.forceRefresh) {
    const cached = matchInfoCache.get(dbuMatchId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const url = `${DBU_MATCH_BASE}/${dbuMatchId}/kampinfo`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`DBU match info fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const root = parse(html);

  // Header info (.col-pad blocks with <label>Label</label><span|div>Value</span|div>)
  let referee: string | null = null;
  let venueName: string | null = null;
  let venueAddress: string | null = null;
  const pitch: string | null = null;

  for (const block of root.querySelectorAll(".col-pad")) {
    const label = block.querySelector("label")?.text.trim().toLowerCase() ?? "";
    if (!label) continue;

    if (label === "dommer") {
      const val = block.querySelector("span")?.text.trim();
      referee = val && val.length ? val : null;
    } else if (label === "spillested") {
      // venue name lives inside a link; address is the following sibling divs
      const divs = block.querySelectorAll("div");
      const nameLink = block.querySelector("a");
      venueName = nameLink?.text.trim() || null;
      const addressLines: string[] = [];
      for (const d of divs) {
        // Skip the div containing the link (venue name)
        if (d.querySelector("a")) continue;
        const t = d.text.trim();
        if (t) addressLines.push(t);
      }
      venueAddress = addressLines.join(", ") || null;
    }
  }

  // Lineups: .sr--match--team-card_home / _away, each with a <table> of <tr><td><span>Name</span></td></tr>
  const homeLineup: string[] = [];
  const awayLineup: string[] = [];
  const homeOfficials: string[] = [];
  const awayOfficials: string[] = [];

  const extractLineup = (
    card: ReturnType<typeof root.querySelector>,
    lineup: string[],
    officials: string[]
  ) => {
    if (!card) return;
    const tables = card.querySelectorAll("table");
    for (const table of tables) {
      const isOfficials = !!table.querySelector("tr.official-tr");
      if (isOfficials) {
        for (const row of table.querySelectorAll("tr.official-tr")) {
          const role = row.querySelector(".p-role")?.text.trim() ?? "";
          const name = row.querySelector(".p-name")?.text.trim() ?? "";
          if (name) {
            officials.push(role ? `${role}: ${name}` : name);
          }
        }
      } else {
        // Skip header row (<thead>), then read each <tr>'s player name span
        for (const row of table.querySelectorAll("tbody tr, tr")) {
          // Skip rows that sit inside <thead>
          if (row.parentNode?.rawTagName === "thead") continue;
          if (row.classList.contains("official-tr")) continue;
          const span = row.querySelector("td:not(.shirt-number) span");
          const name = span?.text.trim();
          if (name) lineup.push(name);
        }
      }
    }
  };

  extractLineup(root.querySelector(".sr--match--team-card_home"), homeLineup, homeOfficials);
  extractLineup(root.querySelector(".sr--match--team-card_away"), awayLineup, awayOfficials);

  // Events: .sr--match--live-score--eventlist > .sr--match--live-score--event
  //   child .sr--match--live-score--event--home | _--event--away tells us the team
  //   <img src="..icon_sr_goal.svg"> indicates goal type
  //   .event--player contains scorer text; optional .event--sub > .event--player2 has assist
  const goalEvents: DbuGoalEvent[] = [];
  const eventNodes = root.querySelectorAll(".sr--match--live-score--event");
  for (const ev of eventNodes) {
    const homeSide = ev.querySelector(".sr--match--live-score--event--home");
    const awaySide = ev.querySelector(".sr--match--live-score--event--away");
    const side = homeSide ?? awaySide;
    if (!side) continue;

    const iconSrc = side.querySelector(".sr--match--live-score--event--icon img")?.getAttribute("src") ?? "";
    // Only keep goal events (the eventlist may later include cards, subs, etc.)
    if (!iconSrc.toLowerCase().includes("goal")) continue;

    const playerWrap = side.querySelector(".sr--match--live-score--event--player");
    if (!playerWrap) continue;

    const assist = playerWrap.querySelector(".sr--match--live-score--event--player2")?.text.trim() || null;

    // Scorer: raw text of the player wrap, with any assist sub-text stripped off the end.
    let scorerText = playerWrap.text.replace(/\s+/g, " ").trim();
    if (assist) {
      // Strip the assist name from the tail (it follows the scorer inside .event--sub)
      const idx = scorerText.lastIndexOf(assist);
      if (idx >= 0) scorerText = scorerText.slice(0, idx).trim();
    }
    const scorer = scorerText;
    if (!scorer) continue;

    const minuteRaw = ev.querySelector(".sr--match--live-score--event--minute")?.text.trim() ?? "";
    const minute = minuteRaw.length ? minuteRaw : null;

    goalEvents.push({
      scorer,
      assist,
      team: homeSide ? "home" : "away",
      minute,
    });
  }

  // Aggregated per-scorer counts for backwards compatibility.
  const tally = new Map<string, { team: "home" | "away"; goals: number }>();
  for (const ev of goalEvents) {
    const key = `${ev.team}|${ev.scorer}`;
    const prev = tally.get(key);
    if (prev) prev.goals += 1;
    else tally.set(key, { team: ev.team, goals: 1 });
  }
  const goalScorers: DbuMatchInfo["goalScorers"] = [];
  for (const [key, { team, goals }] of tally) {
    const name = key.split("|").slice(1).join("|");
    goalScorers.push({ name, team, goals });
  }

  const info: DbuMatchInfo = {
    referee,
    venueName,
    venueAddress,
    pitch,
    homeLineup,
    awayLineup,
    homeOfficials,
    awayOfficials,
    goalScorers,
    goalEvents,
  };

  matchInfoCache.set(dbuMatchId, { data: info, timestamp: Date.now() });
  return info;
}

export function clearCache() {
  standingsCache = null;
  matchesCache = null;
  teamMatchesCache.clear();
  matchInfoCache.clear();
}
