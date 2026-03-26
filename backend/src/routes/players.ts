import { Hono } from "hono";
import { sql } from "../lib/db";

const players = new Hono();

players.get("/", async (c) => {
  const rows = await sql`SELECT * FROM players WHERE active = 1 ORDER BY display_name`;
  return c.json(rows);
});

export default players;
