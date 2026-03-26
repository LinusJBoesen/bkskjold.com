import { Hono } from "hono";
import { sql } from "../lib/db";
import { generateBalancedTeams, swapPlayers, calculatePlayerStats } from "../services/team-generator";
import { SpondClient } from "../services/spond";
import { requireRole } from "../middleware/auth";

const teams = new Hono();

// POST /api/teams/generate — generate balanced teams (admin only)
teams.post("/generate", requireRole("admin"), async (c) => {
  const body = await c.req.json();
  const { playerIds, algorithm = "greedy" } = body;

  if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 2) {
    return c.json({ error: "Mindst 2 spillere kræves" }, 400);
  }

  const result = await generateBalancedTeams(playerIds, algorithm);
  return c.json(result);
});

// POST /api/teams/swap — swap player between teams (admin only)
teams.post("/swap", requireRole("admin"), async (c) => {
  const body = await c.req.json();
  const { team1, team2, playerId } = body;

  const result = swapPlayers(team1, team2, playerId);
  return c.json(result);
});

async function getPlayersById(ids: string[], stats: Awaited<ReturnType<typeof calculatePlayerStats>>) {
  if (ids.length === 0) return [];
  const players = await sql`
    SELECT * FROM players WHERE active = 1 AND id = ANY(${sql.array(ids, 'TEXT')}) ORDER BY display_name
  ` as any[];

  return players.map((p: any) => {
    const stat = stats.find((s) => s.id === p.id);
    return {
      id: p.id,
      displayName: p.display_name,
      profilePicture: p.profile_picture || null,
      winRate: stat?.winRate ?? 0.5,
      matches: stat?.matches ?? 0,
    };
  });
}

// GET /api/teams/available — players who accepted next training + match in Spond (admin + spiller)
teams.get("/available", requireRole("admin", "spiller"), async (c) => {
  const groupId = process.env.SPOND_GROUP_ID;
  const stats = await calculatePlayerStats();

  let trainingEvent: { heading: string; startTimestamp: string; acceptedIds: string[] } | null = null;
  let matchEvent: { heading: string; startTimestamp: string; acceptedIds: string[] } | null = null;

  if (groupId && process.env.SPOND_USERNAME && process.env.SPOND_PASSWORD) {
    try {
      const client = new SpondClient();
      const nextEvents = await client.getNextEvents(groupId);
      trainingEvent = nextEvents.training;
      matchEvent = nextEvents.match;
    } catch (err) {
      console.error("Failed to fetch Spond events:", err);
    }
  }

  const trainingPlayers = trainingEvent && trainingEvent.acceptedIds.length > 0
    ? await getPlayersById(trainingEvent.acceptedIds, stats)
    : [];

  const matchPlayers = matchEvent && matchEvent.acceptedIds.length > 0
    ? await getPlayersById(matchEvent.acceptedIds, stats)
    : [];

  // Always return all active players so the frontend can offer manual selection
  const rows = await sql`SELECT * FROM players WHERE active = 1 ORDER BY display_name` as any[];
  const allPlayers = rows.map((p: any) => {
    const stat = stats.find((s) => s.id === p.id);
    return {
      id: p.id,
      displayName: p.display_name,
      profilePicture: p.profile_picture || null,
      winRate: stat?.winRate ?? 0.5,
      matches: stat?.matches ?? 0,
    };
  });

  return c.json({
    training: trainingEvent
      ? { heading: trainingEvent.heading, date: trainingEvent.startTimestamp, players: trainingPlayers }
      : null,
    match: matchEvent
      ? { heading: matchEvent.heading, date: matchEvent.startTimestamp, players: matchPlayers }
      : null,
    allPlayers,
  });
});

export default teams;
