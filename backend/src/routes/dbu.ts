import { Hono } from "hono";
import { sql } from "../lib/db";
import { scrapeTeamMatches, scrapeMatchInfo, type DbuTeamMatch, type DbuMatchInfo } from "../services/dbu";

const dbu = new Hono();

dbu.get("/teams/:teamId/matches", async (c) => {
  const teamId = c.req.param("teamId");

  // Check DB first
  const rows = (await sql`
    SELECT * FROM dbu_team_matches WHERE team_id = ${teamId} ORDER BY date DESC
  `) as any[];

  if (rows.length > 0) {
    const matches: DbuTeamMatch[] = rows.map((r) => ({
      dbuMatchId: r.dbu_match_id,
      date: r.date,
      time: r.time,
      homeTeam: r.home_team,
      homeTeamId: r.home_team_id,
      awayTeam: r.away_team,
      awayTeamId: r.away_team_id,
      venue: r.venue,
      homeScore: r.home_score,
      awayScore: r.away_score,
    }));
    return c.json({ matches });
  }

  // Scrape fresh if not in DB (uses 1h cache)
  try {
    const matches = await scrapeTeamMatches(teamId);

    // Persist to DB
    for (const tm of matches) {
      await sql`
        INSERT INTO dbu_team_matches (dbu_match_id, team_id, date, time, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue)
        VALUES (${tm.dbuMatchId}, ${teamId}, ${tm.date}, ${tm.time}, ${tm.homeTeam}, ${tm.homeTeamId}, ${tm.awayTeam}, ${tm.awayTeamId}, ${tm.homeScore}, ${tm.awayScore}, ${tm.venue})
        ON CONFLICT (dbu_match_id) DO UPDATE SET
          home_score = EXCLUDED.home_score,
          away_score = EXCLUDED.away_score,
          venue = EXCLUDED.venue,
          synced_at = NOW()
      `;
    }

    return c.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukendt fejl";
    return c.json({ error: message, matches: [] }, 500);
  }
});

dbu.get("/matches/:dbuMatchId/info", async (c) => {
  const dbuMatchId = c.req.param("dbuMatchId");

  // Check DB first
  const [row] = (await sql`
    SELECT * FROM dbu_match_info WHERE dbu_match_id = ${dbuMatchId}
  `) as any[];

  if (row) {
    const info: DbuMatchInfo = {
      referee: row.referee,
      venueName: row.venue_name,
      venueAddress: row.venue_address,
      pitch: row.pitch,
      homeLineup: JSON.parse(row.home_lineup || "[]"),
      awayLineup: JSON.parse(row.away_lineup || "[]"),
      homeOfficials: JSON.parse(row.home_officials || "[]"),
      awayOfficials: JSON.parse(row.away_officials || "[]"),
      goalScorers: JSON.parse(row.goal_scorers || "[]"),
    };
    return c.json({ matchInfo: info });
  }

  // Lazy-fetch from DBU
  try {
    const info = await scrapeMatchInfo(dbuMatchId);

    // Persist to DB
    await sql`
      INSERT INTO dbu_match_info (dbu_match_id, referee, venue_name, venue_address, pitch, home_lineup, away_lineup, home_officials, away_officials, goal_scorers)
      VALUES (${dbuMatchId}, ${info.referee}, ${info.venueName}, ${info.venueAddress}, ${info.pitch}, ${JSON.stringify(info.homeLineup)}, ${JSON.stringify(info.awayLineup)}, ${JSON.stringify(info.homeOfficials)}, ${JSON.stringify(info.awayOfficials)}, ${JSON.stringify(info.goalScorers)})
      ON CONFLICT (dbu_match_id) DO UPDATE SET
        referee = EXCLUDED.referee,
        venue_name = EXCLUDED.venue_name,
        venue_address = EXCLUDED.venue_address,
        pitch = EXCLUDED.pitch,
        home_lineup = EXCLUDED.home_lineup,
        away_lineup = EXCLUDED.away_lineup,
        home_officials = EXCLUDED.home_officials,
        away_officials = EXCLUDED.away_officials,
        goal_scorers = EXCLUDED.goal_scorers,
        synced_at = NOW()
    `;

    return c.json({ matchInfo: info });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukendt fejl";
    return c.json({ error: message, matchInfo: null }, 500);
  }
});

export default dbu;
