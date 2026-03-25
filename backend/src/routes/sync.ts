import { Hono } from "hono";
import { getDb } from "../lib/db";
import { SpondClient } from "../services/spond";
import { scrapeStandings, scrapeMatchHistory } from "../services/dbu";

const sync = new Hono();

sync.post("/spond", async (c) => {
  const groupId = process.env.SPOND_GROUP_ID;

  if (!groupId) {
    // If Spond is not configured, return success with seeded data count
    const db = getDb();
    const count = db.query("SELECT COUNT(*) as count FROM players").get() as { count: number };
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
    const db = getDb();

    // Upsert players
    const upsertPlayer = db.prepare(`
      INSERT INTO players (id, first_name, last_name, display_name, profile_picture, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        display_name = excluded.display_name,
        profile_picture = excluded.profile_picture,
        updated_at = datetime('now')
    `);

    for (const m of members) {
      const displayName = `${m.firstName} ${m.lastName.charAt(0)}.`;
      upsertPlayer.run(m.id, m.firstName, m.lastName, displayName, m.profilePicture);
    }

    // Upsert events and attendance
    const upsertEvent = db.prepare(`
      INSERT INTO spond_events (id, name, start_time, event_type, synced_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        synced_at = datetime('now')
    `);

    const upsertAttendance = db.prepare(`
      INSERT INTO spond_attendance (event_id, player_id, response)
      VALUES (?, ?, ?)
      ON CONFLICT(event_id, player_id) DO UPDATE SET
        response = excluded.response
    `);

    for (const event of events) {
      upsertEvent.run(event.id, event.heading, event.startTimestamp, event.type);
      const responses = event.responses || {};
      for (const pid of responses.acceptedIds || []) {
        upsertAttendance.run(event.id, pid, "accepted");
      }
      for (const pid of responses.declinedIds || []) {
        upsertAttendance.run(event.id, pid, "declined");
      }
      for (const pid of responses.unansweredIds || []) {
        upsertAttendance.run(event.id, pid, "unanswered");
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

    const db = getDb();

    // Replace standings
    db.run("DELETE FROM dbu_standings");
    const insertStanding = db.prepare(`
      INSERT INTO dbu_standings (position, team_name, matches_played, wins, draws, losses, goal_diff, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of standings) {
      insertStanding.run(s.position, s.teamName, s.matchesPlayed, s.wins, s.draws, s.losses, s.goalDiff, s.points);
    }

    // Replace matches
    db.run("DELETE FROM dbu_matches");
    const insertMatch = db.prepare(`
      INSERT INTO dbu_matches (date, home_team, away_team, home_score, away_score)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const m of matches) {
      insertMatch.run(m.date, m.homeTeam, m.awayTeam, m.homeScore, m.awayScore);
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
