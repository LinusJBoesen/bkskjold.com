import { Hono } from "hono";
import { getDb } from "../lib/db";
import { randomUUID } from "crypto";

const formations = new Hono();

// Formation slot definitions
const FORMATION_SLOTS: Record<string, { index: number; position: string }[]> = {
  "1-2-3-1": [
    { index: 0, position: "keeper" },
    { index: 1, position: "defender" },
    { index: 2, position: "defender" },
    { index: 3, position: "wing" },
    { index: 4, position: "midfield" },
    { index: 5, position: "wing" },
    { index: 6, position: "attacker" },
  ],
  "1-3-2-1": [
    { index: 0, position: "keeper" },
    { index: 1, position: "defender" },
    { index: 2, position: "defender" },
    { index: 3, position: "defender" },
    { index: 4, position: "midfield" },
    { index: 5, position: "midfield" },
    { index: 6, position: "attacker" },
  ],
  "1-3-3": [
    { index: 0, position: "keeper" },
    { index: 1, position: "defender" },
    { index: 2, position: "defender" },
    { index: 3, position: "defender" },
    { index: 4, position: "wing" },
    { index: 5, position: "midfield" },
    { index: 6, position: "wing" },
  ],
};

// GET /api/formations/slots — get formation slot definitions
formations.get("/slots", (c) => {
  return c.json(FORMATION_SLOTS);
});

// POST /api/formations — create/save a formation
formations.post("/", async (c) => {
  const db = getDb();
  const body = await c.req.json();
  const { matchId, teamNumber, formation, slots } = body;

  if (!teamNumber || !formation || !FORMATION_SLOTS[formation]) {
    return c.json({ error: "Ugyldig formation" }, 400);
  }

  const id = randomUUID();

  db.query(
    "INSERT INTO lineup_formations (id, match_id, team_number, formation) VALUES (?, ?, ?, ?)"
  ).run(id, matchId || null, teamNumber, formation);

  if (slots && Array.isArray(slots)) {
    const insertSlot = db.prepare(
      "INSERT INTO lineup_slots (formation_id, slot_index, player_id, position, is_bench) VALUES (?, ?, ?, ?, ?)"
    );
    for (const slot of slots) {
      insertSlot.run(id, slot.slotIndex, slot.playerId || null, slot.position, slot.isBench ? 1 : 0);
    }
  }

  return c.json({ id, matchId, teamNumber, formation });
});

// GET /api/formations/:matchId/:teamNumber — get saved formation
formations.get("/:matchId/:teamNumber", (c) => {
  const db = getDb();
  const { matchId, teamNumber } = c.req.param();

  const formation = db.query(
    "SELECT * FROM lineup_formations WHERE match_id = ? AND team_number = ? ORDER BY created_at DESC LIMIT 1"
  ).get(matchId, parseInt(teamNumber)) as any;

  if (!formation) {
    return c.json({ formation: null });
  }

  const slots = db.query(
    "SELECT ls.*, p.display_name, p.profile_picture FROM lineup_slots ls LEFT JOIN players p ON ls.player_id = p.id WHERE ls.formation_id = ? ORDER BY ls.slot_index"
  ).all(formation.id) as any[];

  return c.json({ formation: { ...formation, slots } });
});

// PUT /api/formations/:id — update formation
formations.put("/:id", async (c) => {
  const db = getDb();
  const { id } = c.req.param();
  const body = await c.req.json();
  const { formation, slots } = body;

  const existing = db.query("SELECT * FROM lineup_formations WHERE id = ?").get(id);
  if (!existing) {
    return c.json({ error: "Formation ikke fundet" }, 404);
  }

  if (formation && FORMATION_SLOTS[formation]) {
    db.query("UPDATE lineup_formations SET formation = ? WHERE id = ?").run(formation, id);
  }

  if (slots && Array.isArray(slots)) {
    db.query("DELETE FROM lineup_slots WHERE formation_id = ?").run(id);
    const insertSlot = db.prepare(
      "INSERT INTO lineup_slots (formation_id, slot_index, player_id, position, is_bench) VALUES (?, ?, ?, ?, ?)"
    );
    for (const slot of slots) {
      insertSlot.run(id, slot.slotIndex, slot.playerId || null, slot.position, slot.isBench ? 1 : 0);
    }
  }

  return c.json({ success: true });
});

// DELETE /api/formations/:id — delete formation
formations.delete("/:id", (c) => {
  const db = getDb();
  const { id } = c.req.param();

  const existing = db.query("SELECT * FROM lineup_formations WHERE id = ?").get(id);
  if (!existing) {
    return c.json({ error: "Formation ikke fundet" }, 404);
  }

  db.query("DELETE FROM lineup_formations WHERE id = ?").run(id);
  return c.json({ success: true });
});

// GET /api/formations/players/positions — get all players with their positions
formations.get("/players/positions", (c) => {
  const db = getDb();
  const players = db.query("SELECT * FROM players WHERE active = 1 ORDER BY display_name").all() as any[];
  const positions = db.query("SELECT * FROM player_positions").all() as any[];

  const positionMap: Record<string, string[]> = {};
  for (const p of positions) {
    if (!positionMap[p.player_id]) positionMap[p.player_id] = [];
    positionMap[p.player_id].push(p.position);
  }

  const result = players.map((p: any) => ({
    id: p.id,
    displayName: p.display_name,
    profilePicture: p.profile_picture || null,
    positions: positionMap[p.id] || [],
  }));

  return c.json(result);
});

// GET /api/formations/players/:id/positions — get player's positions
formations.get("/players/:id/positions", (c) => {
  const db = getDb();
  const { id } = c.req.param();
  const rows = db.query("SELECT position FROM player_positions WHERE player_id = ?").all(id) as any[];
  return c.json({ playerId: id, positions: rows.map((r: any) => r.position) });
});

// PUT /api/formations/players/:id/positions — set player's positions
formations.put("/players/:id/positions", async (c) => {
  const db = getDb();
  const { id } = c.req.param();
  const body = await c.req.json();
  const { positions } = body;

  if (!Array.isArray(positions)) {
    return c.json({ error: "Positioner skal være en liste" }, 400);
  }

  const validPositions = ["keeper", "defender", "wing", "midfield", "attacker"];
  for (const pos of positions) {
    if (!validPositions.includes(pos)) {
      return c.json({ error: `Ugyldig position: ${pos}` }, 400);
    }
  }

  db.query("DELETE FROM player_positions WHERE player_id = ?").run(id);
  const insert = db.prepare("INSERT INTO player_positions (player_id, position) VALUES (?, ?)");
  for (const pos of positions) {
    insert.run(id, pos);
  }

  return c.json({ playerId: id, positions });
});

export default formations;
