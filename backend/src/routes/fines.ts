import { Hono } from "hono";
import { sql } from "../lib/db";
import { randomUUID } from "crypto";

const fines = new Hono();

// GET /api/fines — all fines with player info
fines.get("/", async (c) => {
  const playerId = c.req.query("player_id");

  const rows = playerId
    ? await sql`
        SELECT f.*, p.display_name as player_name, ft.name as fine_type_name
        FROM fines f
        JOIN players p ON f.player_id = p.id
        JOIN fine_types ft ON f.fine_type_id = ft.id
        WHERE f.player_id = ${playerId}
        ORDER BY f.created_at DESC
      `
    : await sql`
        SELECT f.*, p.display_name as player_name, ft.name as fine_type_name
        FROM fines f
        JOIN players p ON f.player_id = p.id
        JOIN fine_types ft ON f.fine_type_id = ft.id
        ORDER BY f.created_at DESC
      `;

  return c.json(rows);
});

// GET /api/fines/summary — per-player totals
fines.get("/summary", async (c) => {
  const rows = await sql`
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
    GROUP BY p.id, p.display_name, p.profile_picture
    ORDER BY unpaid DESC, total DESC
  `;
  return c.json(rows);
});

// POST /api/fines — create manual fine
fines.post("/", async (c) => {
  const body = await c.req.json();
  const { player_id, fine_type_id, amount, notes } = body;
  const id = randomUUID();

  await sql`
    INSERT INTO fines (id, player_id, fine_type_id, amount, notes)
    VALUES (${id}, ${player_id}, ${fine_type_id}, ${amount}, ${notes || null})
  `;

  return c.json({ id, success: true }, 201);
});

// PATCH /api/fines/:id/pay — mark as paid
fines.patch("/:id/pay", async (c) => {
  const id = c.req.param("id");
  await sql`UPDATE fines SET paid = 1, paid_date = NOW() WHERE id = ${id}`;
  return c.json({ success: true });
});

// DELETE /api/fines/:id
fines.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await sql`DELETE FROM fines WHERE id = ${id}`;
  return c.json({ success: true });
});

// GET /api/fine-types
fines.get("/types", async (c) => {
  const rows = await sql`SELECT * FROM fine_types ORDER BY is_system DESC, name`;
  return c.json(rows);
});

// POST /api/fine-types
fines.post("/types", async (c) => {
  const body = await c.req.json();
  const { name, amount, description } = body;
  const id = randomUUID();

  await sql`
    INSERT INTO fine_types (id, name, amount, description, is_system)
    VALUES (${id}, ${name}, ${amount}, ${description || null}, 0)
  `;

  return c.json({ id, success: true }, 201);
});

// PUT /api/fine-types/:id
fines.put("/types/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, amount, description } = body;

  await sql`
    UPDATE fine_types SET name = ${name}, amount = ${amount}, description = ${description || null}
    WHERE id = ${id}
  `;

  return c.json({ success: true });
});

// DELETE /api/fine-types/:id
fines.delete("/types/:id", async (c) => {
  const id = c.req.param("id");
  await sql`DELETE FROM fine_types WHERE id = ${id} AND is_system = 0`;
  return c.json({ success: true });
});

export default fines;
