import { Hono } from "hono";
import { fetchStandings, fetchMatchResults } from "../services/dbu";
import { getOurTeamName } from "../services/match-details";

const tournament = new Hono();

tournament.get("/standings", async (c) => {
  const [standings, teamName] = await Promise.all([fetchStandings(), getOurTeamName()]);
  return c.json({ standings, teamName });
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
