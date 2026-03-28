import { Hono } from "hono";
import { sql } from "../lib/db";
import { randomUUID } from "crypto";
import { requireRole } from "../middleware/auth";

const fanSignup = new Hono();

// POST /api/fan-signup — submit fan signup (public)
fanSignup.post("/", async (c) => {
  const body = await c.req.json();
  const { name, email, position, comment, love_level } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return c.json({ error: "Navn er påkrævet" }, 400);
  }

  const id = randomUUID();

  await sql`
    INSERT INTO fan_signups (id, name, email, position, comment, love_level)
    VALUES (${id}, ${name.trim()}, ${email?.trim() || null}, ${position?.trim() || null}, ${comment?.trim() || null}, ${parseInt(love_level) || 5})
  `;

  return c.json({ id, success: true }, 201);
});

// GET /api/fan-signup — list signups (admin only)
fanSignup.get("/", requireRole("admin"), async (c) => {
  const signups = await sql`SELECT * FROM fan_signups ORDER BY created_at DESC`;
  return c.json(signups);
});

// DELETE /api/fan-signup/:id — delete signup (admin only)
fanSignup.delete("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  await sql`DELETE FROM fan_signups WHERE id = ${id}`;
  return c.json({ success: true });
});

export default fanSignup;
