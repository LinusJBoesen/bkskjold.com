import { Hono } from "hono";
import { getDb } from "../lib/db";
import { randomUUID } from "crypto";

const fines = new Hono();

// GET /api/fines — all fines with player info
fines.get("/", (c) => {
  const playerId = c.req.query("player_id");
  const db = getDb();

  let query = `
    SELECT f.*, p.display_name as player_name, ft.name as fine_type_name
    FROM fines f
    JOIN players p ON f.player_id = p.id
    JOIN fine_types ft ON f.fine_type_id = ft.id
  `;
  const params: string[] = [];

  if (playerId) {
    query += " WHERE f.player_id = ?";
    params.push(playerId);
  }

  query += " ORDER BY f.created_at DESC";

  const rows = db.query(query).all(...params);
  return c.json(rows);
});

// GET /api/fines/summary — per-player totals
fines.get("/summary", (c) => {
  const db = getDb();
  const rows = db.query(`
    SELECT
      p.id,
      p.display_name,
      p.profile_picture,
      COALESCE(SUM(f.amount), 0) as total,
      COALESCE(SUM(CASE WHEN f.paid = 1 THEN f.amount ELSE 0 END), 0) as paid,
      COALESCE(SUM(CASE WHEN f.paid = 0 THEN f.amount ELSE 0 END), 0) as unpaid,
      COUNT(f.id) as fine_count
    FROM players p
    LEFT JOIN fines f ON p.id = f.player_id
    WHERE p.active = 1
    GROUP BY p.id
    ORDER BY unpaid DESC, total DESC
  `).all();
  return c.json(rows);
});

// POST /api/fines — create manual fine
fines.post("/", async (c) => {
  const body = await c.req.json();
  const { player_id, fine_type_id, amount, notes } = body;
  const db = getDb();
  const id = randomUUID();

  db.query(`
    INSERT INTO fines (id, player_id, fine_type_id, amount, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, player_id, fine_type_id, amount, notes || null);

  return c.json({ id, success: true }, 201);
});

// PATCH /api/fines/:id/pay — mark as paid
fines.patch("/:id/pay", (c) => {
  const id = c.req.param("id");
  const db = getDb();
  db.query("UPDATE fines SET paid = 1, paid_date = datetime('now') WHERE id = ?").run(id);
  return c.json({ success: true });
});

// DELETE /api/fines/:id
fines.delete("/:id", (c) => {
  const id = c.req.param("id");
  const db = getDb();
  db.query("DELETE FROM fines WHERE id = ?").run(id);
  return c.json({ success: true });
});

// GET /api/fine-types
fines.get("/types", (c) => {
  const db = getDb();
  const rows = db.query("SELECT * FROM fine_types ORDER BY is_system DESC, name").all();
  return c.json(rows);
});

// POST /api/fine-types
fines.post("/types", async (c) => {
  const body = await c.req.json();
  const { name, amount, description } = body;
  const db = getDb();
  const id = randomUUID();

  db.query(`
    INSERT INTO fine_types (id, name, amount, description, is_system)
    VALUES (?, ?, ?, ?, 0)
  `).run(id, name, amount, description || null);

  return c.json({ id, success: true }, 201);
});

// PUT /api/fine-types/:id
fines.put("/types/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, amount, description } = body;
  const db = getDb();

  db.query(`
    UPDATE fine_types SET name = ?, amount = ?, description = ?
    WHERE id = ? AND is_system = 0
  `).run(name, amount, description || null, id);

  return c.json({ success: true });
});

// DELETE /api/fine-types/:id
fines.delete("/types/:id", (c) => {
  const id = c.req.param("id");
  const db = getDb();
  db.query("DELETE FROM fine_types WHERE id = ? AND is_system = 0").run(id);
  return c.json({ success: true });
});

export default fines;
