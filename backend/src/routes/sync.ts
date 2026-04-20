import { Hono } from "hono";
import { sql } from "../lib/db";
import { SpondClient } from "../services/spond";
import { scrapeStandings, scrapeTeamMatches } from "../services/dbu";
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
    const [standings, teamMatches] = await Promise.all([
      scrapeStandings(teamId),
      scrapeTeamMatches(teamId),
    ]);

    // Batch writes in a single transaction so Postgres commits once
    await sql.begin(async (tx) => {
      await tx`DELETE FROM dbu_standings`;
      for (const s of standings) {
        await tx`
          INSERT INTO dbu_standings (position, team_name, matches_played, wins, draws, losses, goal_diff, points)
          VALUES (${s.position}, ${s.teamName}, ${s.matchesPlayed}, ${s.wins}, ${s.draws}, ${s.losses}, ${s.goalDiff}, ${s.points})
        `;
      }

      // dbu_team_matches is the single source of truth for match data.
      // Tournament + match-details both read from here (filtered by team_id).
      // DBU assigns dbu_match_id only after a match is played — upcoming
      // matches and bye weeks scrape as "". Synthesize a stable key for those
      // so they don't collide on the PK.
      await tx`DELETE FROM dbu_team_matches WHERE team_id = ${teamId}`;
      for (const tm of teamMatches) {
        const matchKey = tm.dbuMatchId || `pending_${teamId}_${tm.date}_${tm.homeTeam}_${tm.awayTeam}`;
        await tx`
          INSERT INTO dbu_team_matches (dbu_match_id, team_id, date, time, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue)
          VALUES (${matchKey}, ${teamId}, ${tm.date}, ${tm.time}, ${tm.homeTeam}, ${tm.homeTeamId}, ${tm.awayTeam}, ${tm.awayTeamId}, ${tm.homeScore}, ${tm.awayScore}, ${tm.venue})
          ON CONFLICT (dbu_match_id) DO UPDATE SET
            home_score = EXCLUDED.home_score,
            away_score = EXCLUDED.away_score,
            venue = EXCLUDED.venue,
            time = EXCLUDED.time,
            synced_at = NOW()
        `;
      }
    });

    // Clear cache so next read gets fresh data
    const { clearCache } = await import("../services/dbu");
    clearCache();

    return c.json({
      success: true,
      message: "DBU data hentet fra dbu.dk",
      standings: standings.length,
      matches: teamMatches.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukendt fejl";
    return c.json({ success: false, message }, 500);
  }
});

export default sync;
