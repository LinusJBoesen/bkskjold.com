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

async function getNextEventsFromDb(): Promise<{
  training: { heading: string; startTimestamp: string; acceptedIds: string[] } | null;
  match: { heading: string; startTimestamp: string; acceptedIds: string[] } | null;
}> {
  const eventRows = await sql`
    SELECT id, name, start_time, event_type
    FROM spond_events
    WHERE start_time::timestamptz > NOW()
    ORDER BY start_time ASC
    LIMIT 30
  ` as any[];

  const nextTraining = eventRows.find((e: any) => e.event_type === "RECURRING") ?? null;
  const nextMatch = eventRows.find((e: any) => e.event_type === "EVENT") ?? null;

  async function getAcceptedIds(eventId: string): Promise<string[]> {
    const rows = await sql`
      SELECT player_id FROM spond_attendance
      WHERE event_id = ${eventId} AND response = 'accepted'
    ` as any[];
    return rows.map((r: any) => r.player_id);
  }

  return {
    training: nextTraining
      ? { heading: nextTraining.name, startTimestamp: nextTraining.start_time, acceptedIds: await getAcceptedIds(nextTraining.id) }
      : null,
    match: nextMatch
      ? { heading: nextMatch.name, startTimestamp: nextMatch.start_time, acceptedIds: await getAcceptedIds(nextMatch.id) }
      : null,
  };
}

// GET /api/teams/available — players who accepted next training + match (live Spond, with DB fallback)
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
      console.error("Failed to fetch Spond events live, falling back to DB:", err);
    }
  }

  // Fall back to DB cache if live Spond wasn't used or failed
  if (!trainingEvent && !matchEvent) {
    const db = await getNextEventsFromDb();
    trainingEvent = db.training;
    matchEvent = db.match;
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

// POST /api/teams/lineup — save a training lineup (admin only)
teams.post("/lineup", requireRole("admin"), async (c) => {
  const body = await c.req.json();
  const { label, team1, team2, eventDate } = body;

  if (!team1 || !team2 || !Array.isArray(team1) || !Array.isArray(team2)) {
    return c.json({ error: "Ugyldigt hold-data" }, 400);
  }
  if (!eventDate) {
    return c.json({ error: "eventDate er påkrævet" }, 400);
  }

  const id = crypto.randomUUID();
  const lbl = label || new Date(eventDate).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" });

  await sql`
    INSERT INTO training_lineups (id, label, event_date, team1, team2)
    VALUES (${id}, ${lbl}, ${eventDate}, ${JSON.stringify(team1)}, ${JSON.stringify(team2)})
  `;

  return c.json({ id, label: lbl });
});

// GET /api/teams/lineup — get the latest saved training lineup that hasn't expired (admin + spiller)
teams.get("/lineup", requireRole("admin", "spiller"), async (c) => {
  const rows = await sql`
    SELECT id, label, event_date, team1, team2, created_at
    FROM training_lineups
    WHERE event_date::date >= CURRENT_DATE
    ORDER BY event_date ASC
    LIMIT 1
  ` as any[];

  if (rows.length === 0) return c.json({ lineup: null });

  const row = rows[0];
  return c.json({
    lineup: {
      id: row.id,
      label: row.label,
      eventDate: row.event_date,
      team1: JSON.parse(row.team1),
      team2: JSON.parse(row.team2),
      createdAt: row.created_at,
    },
  });
});

export default teams;
