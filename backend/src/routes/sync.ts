import { Hono } from "hono";
import { sql } from "../lib/db";
import { SpondClient } from "../services/spond";
import { scrapeStandings, scrapeMatchHistory } from "../services/dbu";
import { requireRole } from "../middleware/auth";

const sync = new Hono();

// All sync routes are admin only
sync.use("/*", requireRole("admin"));

sync.post("/spond", async (c) => {
  const groupId = process.env.SPOND_GROUP_ID;

  if (!groupId) {
    // If Spond is not configured, return success with seeded data count
    const [count] = await sql`SELECT COUNT(*) as count FROM players`;
    return c.json({
      success: true,
      message: "Spond ikke konfigureret — bruger eksisterende data",
      players: count.count,
      events: 0,
    });
  }

  try {
    const client = new SpondClient();
    const members = await client.getGroupMembers(groupId);
    const events = await client.getEvents(groupId);

    // Upsert players
    for (const m of members) {
      const displayName = `${m.firstName} ${m.lastName.charAt(0)}.`;
      await sql`
        INSERT INTO players (id, first_name, last_name, display_name, profile_picture, updated_at)
        VALUES (${m.id}, ${m.firstName}, ${m.lastName}, ${displayName}, ${m.profilePicture}, NOW())
        ON CONFLICT(id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          display_name = EXCLUDED.display_name,
          profile_picture = EXCLUDED.profile_picture,
          updated_at = NOW()
      `;
    }

    // Upsert events and attendance
    for (const event of events) {
      await sql`
        INSERT INTO spond_events (id, name, start_time, end_time, event_type, location_name, location_address, synced_at)
        VALUES (${event.id}, ${event.heading}, ${event.startTimestamp}, ${event.endTimestamp ?? null}, ${event.type}, ${event.location?.feature ?? null}, ${event.location?.address ?? null}, NOW())
        ON CONFLICT(id) DO UPDATE SET
          name = EXCLUDED.name,
          end_time = EXCLUDED.end_time,
          location_name = EXCLUDED.location_name,
          location_address = EXCLUDED.location_address,
          synced_at = NOW()
      `;

      const responses = event.responses || {};
      for (const pid of responses.acceptedIds || []) {
        await sql`
          INSERT INTO spond_attendance (event_id, player_id, response)
          VALUES (${event.id}, ${pid}, 'accepted')
          ON CONFLICT(event_id, player_id) DO UPDATE SET response = EXCLUDED.response
        `;
      }
      for (const pid of responses.declinedIds || []) {
        await sql`
          INSERT INTO spond_attendance (event_id, player_id, response)
          VALUES (${event.id}, ${pid}, 'declined')
          ON CONFLICT(event_id, player_id) DO UPDATE SET response = EXCLUDED.response
        `;
      }
      for (const pid of responses.unansweredIds || []) {
        await sql`
          INSERT INTO spond_attendance (event_id, player_id, response)
          VALUES (${event.id}, ${pid}, 'unanswered')
          ON CONFLICT(event_id, player_id) DO UPDATE SET response = EXCLUDED.response
        `;
      }
    }

    return c.json({
      success: true,
      message: "Synkronisering fuldført",
      players: members.length,
      events: events.length,
    });
  } catch (err) {
    console.error("Spond sync error:", err);
    const message = err instanceof Error ? err.message : "Ukendt fejl";
    return c.json({ success: false, message }, 500);
  }
});

sync.post("/dbu", async (c) => {
  const teamId = process.env.DBU_TEAM_ID;

  if (!teamId) {
    return c.json({
      success: false,
      message: "DBU_TEAM_ID ikke konfigureret",
    }, 400);
  }

  try {
    const [standings, matches] = await Promise.all([
      scrapeStandings(teamId),
      scrapeMatchHistory(teamId),
    ]);

    // Replace standings
    await sql`DELETE FROM dbu_standings`;
    for (const s of standings) {
      await sql`
        INSERT INTO dbu_standings (position, team_name, matches_played, wins, draws, losses, goal_diff, points)
        VALUES (${s.position}, ${s.teamName}, ${s.matchesPlayed}, ${s.wins}, ${s.draws}, ${s.losses}, ${s.goalDiff}, ${s.points})
      `;
    }

    // Replace matches
    await sql`DELETE FROM dbu_matches`;
    for (const m of matches) {
      await sql`
        INSERT INTO dbu_matches (date, home_team, away_team, home_score, away_score)
        VALUES (${m.date}, ${m.homeTeam}, ${m.awayTeam}, ${m.homeScore}, ${m.awayScore})
      `;
    }

    // Clear cache so next read gets fresh data
    const { clearCache } = await import("../services/dbu");
    clearCache();

    return c.json({
      success: true,
      message: "DBU data hentet fra dbu.dk",
      standings: standings.length,
      matches: matches.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukendt fejl";
    return c.json({ success: false, message }, 500);
  }
});

export default sync;
