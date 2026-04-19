import { parse } from "node-html-parser";
import { sql } from "../lib/db";

const DBU_BASE = "https://www.dbu.dk/resultater/hold";
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
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
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

let standingsCache: { data: Standing[]; timestamp: number } | null = null;
let matchesCache: { data: DbuMatch[]; timestamp: number } | null = null;
const teamMatchesCache = new Map<string, { data: DbuTeamMatch[]; timestamp: number }>();
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

export async function scrapeMatchHistory(teamId: string): Promise<DbuMatch[]> {
  const url = `${DBU_BASE}/${teamId}/kampprogram`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`DBU match history fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const root = parse(html);

  const table = root.querySelector("table");
  if (!table) {
    throw new Error("Could not find match table on DBU page");
  }

  const rows = table.querySelectorAll("tr");
  const matches: DbuMatch[] = [];

  // Skip header row
  // Expected columns: [empty, Kampnr, Dato, Tid, Hjemme, Ude, Spillested, Resultat]
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    const cells = row.querySelectorAll("td, th");
    if (cells.length < 7) continue;

    const dateStr = cells[2]?.text.trim() ?? "";
    const homeTeam = cells[4]?.text.trim() ?? "";
    const awayTeam = cells[5]?.text.trim() ?? "";
    const resultStr = cells[7]?.text.trim() ?? "";

    if (!dateStr || !homeTeam || !awayTeam) continue;

    // Parse date: DBU format "fre.22-08 2025" -> "2025-08-22"
    const isoDate = parseDbuDate(dateStr);

    // Parse result: "2-1" or "2 - 1" or empty (upcoming match)
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
      date: isoDate ?? dateStr,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
    });
  }

  return matches;
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

export async function fetchMatchResults(): Promise<(DbuMatch & { dbuMatchId?: string })[]> {
  if (matchesCache && Date.now() - matchesCache.timestamp < CACHE_TTL) {
    return matchesCache.data;
  }

  const rows = await sql`SELECT * FROM dbu_matches ORDER BY date DESC` as any[];

  const matches = rows.map((r) => ({
    date: r.date,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    homeScore: r.home_score,
    awayScore: r.away_score,
    dbuMatchId: r.dbu_match_id ?? undefined,
  }));

  matchesCache = { data: matches, timestamp: Date.now() };
  return matches;
}

export function clearCache() {
  standingsCache = null;
  matchesCache = null;
  teamMatchesCache.clear();
}
