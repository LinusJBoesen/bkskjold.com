import { Hono } from "hono";
import { getDb } from "../lib/db";
import { randomUUID } from "crypto";

const matches = new Hono();

// GET /api/matches
matches.get("/", (c) => {
  const status = c.req.query("status");
  const db = getDb();
  let query = `
    SELECT m.*,
      json_group_array(json_object('player_id', mp.player_id, 'team', mp.team, 'display_name',
        (SELECT display_name FROM players WHERE id = mp.player_id)
      )) as players_json
    FROM matches m
    LEFT JOIN match_players mp ON m.id = mp.match_id
  `;
  const params: string[] = [];
  if (status) {
    query += " WHERE m.status = ?";
    params.push(status);
  }
  query += " GROUP BY m.id ORDER BY m.date DESC";
  const rows = db.query(query).all(...params) as any[];
  const result = rows.map((r) => ({
    ...r,
    players: JSON.parse(r.players_json),
    players_json: undefined,
  }));
  return c.json(result);
});

// GET /api/matches/:id
matches.get("/:id", (c) => {
  const id = c.req.param("id");
  const db = getDb();
  const match = db.query("SELECT * FROM matches WHERE id = ?").get(id) as any;
  if (!match) return c.json({ error: "Not found" }, 404);

  const players = db.query(`
    SELECT mp.*, p.display_name
    FROM match_players mp
    JOIN players p ON mp.player_id = p.id
    WHERE mp.match_id = ?
  `).all(id);

  return c.json({ ...match, players });
});

// POST /api/matches — create match (from team selector)
matches.post("/", async (c) => {
  const body = await c.req.json();
  const { team1, team2, date } = body;
  const db = getDb();
  const id = randomUUID();
  const matchDate = date || new Date().toISOString().split("T")[0];

  db.query("INSERT INTO matches (id, date, status) VALUES (?, ?, 'pending')").run(id, matchDate);

  const insertPlayer = db.prepare("INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)");
  for (const playerId of team1) {
    insertPlayer.run(id, playerId, 1);
  }
  for (const playerId of team2) {
    insertPlayer.run(id, playerId, 2);
  }

  return c.json({ id, success: true }, 201);
});

// PATCH /api/matches/:id/result — register result
matches.patch("/:id/result", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { winning_team } = body;
  const db = getDb();

  db.query(`
    UPDATE matches SET status = 'completed', winning_team = ?, completed_at = datetime('now')
    WHERE id = ?
  `).run(winning_team, id);

  // Auto-create training_loss fines for losing team
  const losingTeam = winning_team === 1 ? 2 : 1;
  const losers = db.query(
    "SELECT player_id FROM match_players WHERE match_id = ? AND team = ?"
  ).all(id, losingTeam) as Array<{ player_id: string }>;

  const match = db.query("SELECT date FROM matches WHERE id = ?").get(id) as { date: string };

  const insertFine = db.prepare(`
    INSERT OR IGNORE INTO fines (id, player_id, fine_type_id, event_name, event_date, amount)
    VALUES (?, ?, 'training_loss', ?, ?, 25)
  `);

  for (const loser of losers) {
    const fineId = `loss-${id}-${loser.player_id}`;
    insertFine.run(fineId, loser.player_id, `Tabt træningsmatch`, match.date);
  }

  return c.json({ success: true });
});

// DELETE /api/matches/:id
matches.delete("/:id", (c) => {
  const id = c.req.param("id");
  const db = getDb();
  db.query("DELETE FROM matches WHERE id = ?").run(id);
  return c.json({ success: true });
});

// GET /api/matches/stats — player statistics
matches.get("/stats/all", (c) => {
  const db = getDb();
  const rows = db.query(`
    SELECT
      p.id,
      p.display_name,
      COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as matches,
      SUM(CASE WHEN m.winning_team = mp.team THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN m.winning_team IS NOT NULL AND m.winning_team != mp.team THEN 1 ELSE 0 END) as losses
    FROM players p
    LEFT JOIN match_players mp ON p.id = mp.player_id
    LEFT JOIN matches m ON mp.match_id = m.id
    WHERE p.active = 1
    GROUP BY p.id
    ORDER BY wins DESC, matches DESC
  `).all();
  return c.json(rows);
});

// GET /api/matches/export/csv
matches.get("/export/csv", (c) => {
  const db = getDb();
  const rows = db.query(`
    SELECT m.id, m.date, m.status, m.winning_team, mp.player_id, p.display_name, mp.team
    FROM matches m
    JOIN match_players mp ON m.id = mp.match_id
    JOIN players p ON mp.player_id = p.id
    ORDER BY m.date DESC
  `).all() as any[];

  const csv = ["Kamp ID,Dato,Status,Vindende Hold,Spiller,Hold"];
  for (const r of rows) {
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
