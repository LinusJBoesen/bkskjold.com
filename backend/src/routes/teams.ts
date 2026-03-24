import { Hono } from "hono";
import { getDb } from "../lib/db";
import { generateBalancedTeams, swapPlayers, calculatePlayerStats } from "../services/team-generator";
import { SpondClient } from "../services/spond";

const teams = new Hono();

// POST /api/teams/generate — generate balanced teams
teams.post("/generate", async (c) => {
  const body = await c.req.json();
  const { playerIds, algorithm = "greedy" } = body;

  if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 2) {
    return c.json({ error: "Mindst 2 spillere kræves" }, 400);
  }

  const result = generateBalancedTeams(playerIds, algorithm);
  return c.json(result);
});

// POST /api/teams/swap — swap player between teams
teams.post("/swap", async (c) => {
  const body = await c.req.json();
  const { team1, team2, playerId } = body;

  const result = swapPlayers(team1, team2, playerId);
  return c.json(result);
});

function getPlayersById(ids: string[], stats: ReturnType<typeof calculatePlayerStats>) {
  const db = getDb();
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const players = db.query(
    `SELECT * FROM players WHERE active = 1 AND id IN (${placeholders}) ORDER BY display_name`
  ).all(...ids) as any[];

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

// GET /api/teams/available — players who accepted next training + match in Spond
teams.get("/available", async (c) => {
  const db = getDb();
  const groupId = process.env.SPOND_GROUP_ID;
  const stats = calculatePlayerStats();

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
    ? getPlayersById(trainingEvent.acceptedIds, stats)
    : [];

  const matchPlayers = matchEvent && matchEvent.acceptedIds.length > 0
    ? getPlayersById(matchEvent.acceptedIds, stats)
    : [];

  // Fallback: all active players if neither has accepted players
  let allPlayers: any[] = [];
  if (trainingPlayers.length === 0 && matchPlayers.length === 0) {
    const rows = db.query("SELECT * FROM players WHERE active = 1 ORDER BY display_name").all() as any[];
    allPlayers = rows.map((p: any) => {
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
