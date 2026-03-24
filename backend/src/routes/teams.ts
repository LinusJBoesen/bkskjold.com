import { Hono } from "hono";
import { getDb } from "../lib/db";
import { generateBalancedTeams, swapPlayers, calculatePlayerStats } from "../services/team-generator";

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

// GET /api/teams/available — players available for next training
teams.get("/available", (c) => {
  const db = getDb();
  // Return all active players (in a real setup, would filter by Spond accepted)
  const players = db.query("SELECT * FROM players WHERE active = 1 ORDER BY display_name").all();
  const stats = calculatePlayerStats();

  const available = players.map((p: any) => {
    const stat = stats.find((s) => s.id === p.id);
    return {
      id: p.id,
      displayName: p.display_name,
      profilePicture: p.profile_picture || null,
      winRate: stat?.winRate ?? 0.5,
      matches: stat?.matches ?? 0,
    };
  });

  return c.json(available);
});

export default teams;
