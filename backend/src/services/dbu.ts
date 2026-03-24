import { getDb } from "../lib/db";

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

let standingsCache: { data: Standing[]; timestamp: number } | null = null;
let matchesCache: { data: DbuMatch[]; timestamp: number } | null = null;
const CACHE_TTL = 3600_000; // 1 hour

export async function fetchStandings(): Promise<Standing[]> {
  if (standingsCache && Date.now() - standingsCache.timestamp < CACHE_TTL) {
    return standingsCache.data;
  }

  // In production, would scrape from DBU website
  // For now, return data from DB (populated by sync)
  const db = getDb();
  const rows = db.query(
    "SELECT * FROM dbu_standings ORDER BY position ASC"
  ).all() as any[];

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

export async function fetchMatchResults(): Promise<DbuMatch[]> {
  if (matchesCache && Date.now() - matchesCache.timestamp < CACHE_TTL) {
    return matchesCache.data;
  }

  const db = getDb();
  const rows = db.query(
    "SELECT * FROM dbu_matches ORDER BY date DESC"
  ).all() as any[];

  const matches = rows.map((r) => ({
    date: r.date,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    homeScore: r.home_score,
    awayScore: r.away_score,
  }));

  matchesCache = { data: matches, timestamp: Date.now() };
  return matches;
}

export function seedDbuData() {
  const db = getDb();

  // Check if already seeded
  const count = db.query("SELECT COUNT(*) as c FROM dbu_standings").get() as { c: number };
  if (count.c > 0) return;

  const standings = [
    { position: 1, team_name: "FC Nordvest", matches_played: 14, wins: 11, draws: 2, losses: 1, goal_diff: "+28", points: 35 },
    { position: 2, team_name: "BK Skjold", matches_played: 14, wins: 10, draws: 2, losses: 2, goal_diff: "+22", points: 32 },
    { position: 3, team_name: "Vanløse IF", matches_played: 14, wins: 8, draws: 3, losses: 3, goal_diff: "+14", points: 27 },
    { position: 4, team_name: "Husum BK", matches_played: 14, wins: 7, draws: 3, losses: 4, goal_diff: "+8", points: 24 },
    { position: 5, team_name: "Boldklubben af 1893", matches_played: 14, wins: 6, draws: 2, losses: 6, goal_diff: "+2", points: 20 },
    { position: 6, team_name: "FB Copenhagen", matches_played: 14, wins: 5, draws: 3, losses: 6, goal_diff: "-3", points: 18 },
    { position: 7, team_name: "Brønshøj BK", matches_played: 14, wins: 4, draws: 2, losses: 8, goal_diff: "-10", points: 14 },
    { position: 8, team_name: "Nørrebro United", matches_played: 14, wins: 3, draws: 3, losses: 8, goal_diff: "-15", points: 12 },
    { position: 9, team_name: "Østerbro IF", matches_played: 14, wins: 2, draws: 2, losses: 10, goal_diff: "-22", points: 8 },
    { position: 10, team_name: "Amager BK", matches_played: 14, wins: 1, draws: 2, losses: 11, goal_diff: "-24", points: 5 },
  ];

  const insertStanding = db.prepare(`
    INSERT INTO dbu_standings (position, team_name, matches_played, wins, draws, losses, goal_diff, points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of standings) {
    insertStanding.run(s.position, s.team_name, s.matches_played, s.wins, s.draws, s.losses, s.goal_diff, s.points);
  }

  const dbuMatches = [
    { date: "2025-03-15", home_team: "BK Skjold", away_team: "Vanløse IF", home_score: 3, away_score: 1 },
    { date: "2025-03-08", home_team: "Husum BK", away_team: "BK Skjold", home_score: 1, away_score: 2 },
    { date: "2025-03-01", home_team: "BK Skjold", away_team: "FC Nordvest", home_score: 0, away_score: 1 },
    { date: "2025-02-22", home_team: "Brønshøj BK", away_team: "BK Skjold", home_score: 0, away_score: 4 },
    { date: "2025-02-15", home_team: "BK Skjold", away_team: "Nørrebro United", home_score: 2, away_score: 2 },
  ];

  const insertMatch = db.prepare(`
    INSERT INTO dbu_matches (date, home_team, away_team, home_score, away_score)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const m of dbuMatches) {
    insertMatch.run(m.date, m.home_team, m.away_team, m.home_score, m.away_score);
  }
}
