import { Hono } from "hono";
import { sql } from "../lib/db";
import { randomUUID } from "crypto";
import { requireRole } from "../middleware/auth";

const matches = new Hono();

// GET /api/matches (admin + spiller)
matches.get("/", requireRole("admin", "spiller"), async (c) => {
  const status = c.req.query("status");
  const baseQuery = `
    SELECT m.*,
      COALESCE(json_agg(json_build_object('player_id', mp.player_id, 'team', mp.team, 'display_name',
        p.display_name
      )) FILTER (WHERE mp.player_id IS NOT NULL), '[]') as players
    FROM matches m
    LEFT JOIN match_players mp ON m.id = mp.match_id
    LEFT JOIN players p ON mp.player_id = p.id
  `;

  const rows = status
    ? await sql.unsafe(
        baseQuery + " WHERE m.status = $1 GROUP BY m.id ORDER BY m.date DESC",
        [status]
      )
    : await sql.unsafe(
        baseQuery + " GROUP BY m.id ORDER BY m.date DESC"
      );

  return c.json(rows);
});

// GET /api/matches/:id (admin + spiller)
matches.get("/:id", requireRole("admin", "spiller"), async (c) => {
  const id = c.req.param("id");
  const [match] = await sql`SELECT * FROM matches WHERE id = ${id}`;
  if (!match) return c.json({ error: "Not found" }, 404);

  const players = await sql`
    SELECT mp.*, p.display_name
    FROM match_players mp
    JOIN players p ON mp.player_id = p.id
    WHERE mp.match_id = ${id}
  `;

  return c.json({ ...match, players });
});

// POST /api/matches — create match (admin only)
matches.post("/", requireRole("admin"), async (c) => {
  const body = await c.req.json();
  const { team1, team2, date } = body;
  const id = randomUUID();
  const matchDate = date || new Date().toISOString().split("T")[0];

  await sql`INSERT INTO matches (id, date, status) VALUES (${id}, ${matchDate}, 'pending')`;

  for (const playerId of team1) {
    await sql`INSERT INTO match_players (match_id, player_id, team) VALUES (${id}, ${playerId}, 1)`;
  }
  for (const playerId of team2) {
    await sql`INSERT INTO match_players (match_id, player_id, team) VALUES (${id}, ${playerId}, 2)`;
  }

  return c.json({ id, success: true }, 201);
});

// PATCH /api/matches/:id/result — register result (admin only)
matches.patch("/:id/result", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { winning_team } = body;

  await sql`
    UPDATE matches SET status = 'completed', winning_team = ${winning_team}, completed_at = NOW()
    WHERE id = ${id}
  `;

  // Auto-create training_loss fines for losing team
  const losingTeam = winning_team === 1 ? 2 : 1;
  const losers = await sql`
    SELECT player_id FROM match_players WHERE match_id = ${id} AND team = ${losingTeam}
  `;

  const [match] = await sql`SELECT date FROM matches WHERE id = ${id}`;

  for (const loser of losers) {
    const fineId = `loss-${id}-${loser.player_id}`;
    await sql`
      INSERT INTO fines (id, player_id, fine_type_id, event_name, event_date, amount)
      VALUES (${fineId}, ${loser.player_id}, 'training_loss', 'Tabt træningsmatch', ${match.date}, 25)
      ON CONFLICT DO NOTHING
    `;
  }

  return c.json({ success: true });
});

// DELETE /api/matches/:id (admin only)
matches.delete("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  await sql`DELETE FROM matches WHERE id = ${id}`;
  return c.json({ success: true });
});

// GET /api/matches/stats — player statistics (admin + spiller)
matches.get("/stats/all", requireRole("admin", "spiller"), async (c) => {
  const rows = await sql`
    SELECT
      p.id,
      p.display_name,
      p.profile_picture,
      COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as matches,
      COALESCE(SUM(CASE WHEN m.winning_team = mp.team THEN 1 ELSE 0 END), 0) as wins,
      COALESCE(SUM(CASE WHEN m.winning_team IS NOT NULL AND m.winning_team != mp.team THEN 1 ELSE 0 END), 0) as losses
    FROM players p
    LEFT JOIN match_players mp ON p.id = mp.player_id
    LEFT JOIN matches m ON mp.match_id = m.id
    WHERE p.active = 1
    GROUP BY p.id, p.display_name, p.profile_picture
    ORDER BY wins DESC, matches DESC
  `;
  return c.json(rows);
});

// GET /api/matches/export/csv (admin + spiller)
matches.get("/export/csv", requireRole("admin", "spiller"), async (c) => {
  const rows = await sql`
    SELECT m.id, m.date, m.status, m.winning_team, mp.player_id, p.display_name, mp.team
    FROM matches m
    JOIN match_players mp ON m.id = mp.match_id
    JOIN players p ON mp.player_id = p.id
    ORDER BY m.date DESC
  `;

  const csv = ["Kamp ID,Dato,Status,Vindende Hold,Spiller,Hold"];
  for (const r of rows as any[]) {
    csv.push(`${r.id},${r.date},${r.status},${r.winning_team || ""},${r.display_name},${r.team}`);
  }

  return new Response(csv.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=kampe.csv",
    },
  });
});

export default matches;
