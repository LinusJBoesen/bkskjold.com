import { Hono } from "hono";
import { fetchStandings } from "../services/dbu";

const tournament = new Hono();

tournament.get("/standings", async (c) => {
  const standings = await fetchStandings();
  return c.json({ standings });
});

export default tournament;
