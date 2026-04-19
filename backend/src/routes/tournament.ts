import { Hono } from "hono";
import { fetchStandings, fetchMatchResults } from "../services/dbu";

const tournament = new Hono();

tournament.get("/standings", async (c) => {
  const standings = await fetchStandings();
  return c.json({ standings });
});

tournament.get("/matches", async (c) => {
  const allMatches = await fetchMatchResults();

  const upcoming = allMatches
    .filter((m) => m.homeScore === null || m.awayScore === null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const previous = allMatches
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  return c.json({
    upcoming: upcoming.map((m) => ({ ...m, dbuMatchId: m.dbuMatchId ?? null })),
    previous: previous.map((m) => ({ ...m, dbuMatchId: m.dbuMatchId ?? null })),
  });
});

export default tournament;
