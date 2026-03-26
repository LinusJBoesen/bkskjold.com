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
    return { date: m.date, opponent, result, score, isHome };
  });

  // Get all active players with their attendance at Spond events near match dates
  const players = await sql`
    SELECT id, display_name FROM players WHERE active = 1 ORDER BY display_name
  ` as { id: string; display_name: string }[];

  // Get spond events (which may correspond to match days)
  const spondEvents = await sql`
    SELECT id, name, start_time FROM spond_events ORDER BY start_time DESC
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

  // Calculate per-player stats from internal training matches
  const statsRows = await sql`
    SELECT
      p.id,
      p.display_name,
      p.profile_picture,
      COUNT(mp.match_id) as matches,
      COALESCE(SUM(CASE WHEN m.winning_team = mp.team THEN 1 ELSE 0 END), 0) as wins,
      COALESCE(SUM(CASE WHEN m.winning_team IS NOT NULL AND m.winning_team != mp.team THEN 1 ELSE 0 END), 0) as losses
    FROM players p
    LEFT JOIN match_players mp ON mp.player_id = p.id
    LEFT JOIN matches m ON m.id = mp.match_id AND m.status = 'completed'
    WHERE p.active = 1
    GROUP BY p.id, p.display_name, p.profile_picture
    ORDER BY p.display_name
  ` as {
    id: string;
    display_name: string;
    profile_picture: string | null;
    matches: number;
    wins: number;
    losses: number;
  }[];

  const playerRates = statsRows.map((s) => ({
    id: s.id,
    displayName: s.display_name,
    profilePicture: s.profile_picture || null,
    trainingMatches: Number(s.matches),
    trainingWins: Number(s.wins),
    trainingLosses: Number(s.losses),
    trainingWinRate: Number(s.matches) > 0 ? Math.round((Number(s.wins) / Number(s.matches)) * 100) : 0,
  }));

  return c.json({
    dbuMatches: matchResults,
    dbuSummary: {
      total: matchResults.length,
      wins: matchResults.filter((m) => m.result === "win").length,
      draws: matchResults.filter((m) => m.result === "draw").length,
      losses: matchResults.filter((m) => m.result === "loss").length,
    },
    playerRates,
  });
});

export default analysis;
