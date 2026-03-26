import { Hono } from "hono";
import { sql } from "../lib/db";
import { requireRole } from "../middleware/auth";

const players = new Hono();

players.get("/", requireRole("admin", "spiller"), async (c) => {
  const rows = await sql`SELECT * FROM players WHERE active = 1 ORDER BY display_name`;
  return c.json(rows);
});

export default players;
