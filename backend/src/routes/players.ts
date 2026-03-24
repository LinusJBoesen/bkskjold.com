import { Hono } from "hono";
import { getDb } from "../lib/db";

const players = new Hono();

players.get("/", (c) => {
  const db = getDb();
  const rows = db.query("SELECT * FROM players WHERE active = 1 ORDER BY display_name").all();
  return c.json(rows);
});

export default players;
