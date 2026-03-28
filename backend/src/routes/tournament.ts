import { Hono } from "hono";
import { fetchStandings, fetchMatchResults } from "../services/dbu";

const tournament = new Hono();

tournament.get("/standings", async (c) => {
  const standings = await fetchStandings();
  return c.json({ standings });
});

tournament.get("/matches", async (c) => {
  const matches = await fetchMatchResults();
  return c.json({ matches });
});

export default tournament;
