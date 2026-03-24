import { Hono } from "hono";
import { getDb } from "../lib/db";

const admin = new Hono();

// GET /api/admin/config — read all config values
admin.get("/config", (c) => {
  const db = getDb();
  const rows = db.query("SELECT * FROM config ORDER BY key").all();
  return c.json(rows);
});

// PUT /api/admin/config/:key — update config value
admin.put("/config/:key", async (c) => {
  const key = c.req.param("key");
  const body = await c.req.json();
  const { value } = body;

  if (value === undefined || value === null) {
    return c.json({ error: "Værdi er påkrævet" }, 400);
  }

  const db = getDb();
  db.query(
    `INSERT INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`
  ).run(key, String(value), String(value));

  return c.json({ success: true });
});

// GET /api/admin/export — full database export as JSON
admin.get("/export", (c) => {
  const db = getDb();

  const data = {
    players: db.query("SELECT * FROM players").all(),
    fine_types: db.query("SELECT * FROM fine_types").all(),
    fines: db.query("SELECT * FROM fines").all(),
    matches: db.query("SELECT * FROM matches").all(),
    match_players: db.query("SELECT * FROM match_players").all(),
    spond_events: db.query("SELECT * FROM spond_events").all(),
    spond_attendance: db.query("SELECT * FROM spond_attendance").all(),
    dbu_standings: db.query("SELECT * FROM dbu_standings").all(),
    dbu_matches: db.query("SELECT * FROM dbu_matches").all(),
    config: db.query("SELECT * FROM config").all(),
    exported_at: new Date().toISOString(),
  };

  return c.json(data);
});

// POST /api/admin/import — import JSON data
admin.post("/import", async (c) => {
  const body = await c.req.json();
  const db = getDb();

  try {
    db.exec("BEGIN TRANSACTION");

    // Clear non-system data
    db.exec("DELETE FROM spond_attendance");
    db.exec("DELETE FROM spond_events");
    db.exec("DELETE FROM match_players");
    db.exec("DELETE FROM fines");
    db.exec("DELETE FROM matches");
    db.exec("DELETE FROM dbu_standings");
    db.exec("DELETE FROM dbu_matches");
    db.exec("DELETE FROM fine_types WHERE is_system = 0");
    db.exec("DELETE FROM players");
    db.exec("DELETE FROM config");

    // Import players
    if (body.players?.length) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO players (id, first_name, last_name, display_name, profile_picture, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      );
      for (const p of body.players) {
        stmt.run(p.id, p.first_name, p.last_name, p.display_name, p.profile_picture || null, p.active ?? 1, p.created_at, p.updated_at);
      }
    }

    // Import custom fine types
    if (body.fine_types?.length) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO fine_types (id, name, amount, description, is_system, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      );
      for (const ft of body.fine_types) {
        stmt.run(ft.id, ft.name, ft.amount, ft.description || null, ft.is_system, ft.created_at);
      }
    }

    // Import fines
    if (body.fines?.length) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO fines (id, player_id, fine_type_id, amount, paid, paid_date, notes, event_id, event_name, event_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      for (const f of body.fines) {
        stmt.run(f.id, f.player_id, f.fine_type_id, f.amount, f.paid, f.paid_date || null, f.notes || null, f.event_id || null, f.event_name || null, f.event_date || null, f.created_at);
      }
    }

    // Import matches
    if (body.matches?.length) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO matches (id, date, status, winning_team, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)"
      );
      for (const m of body.matches) {
        stmt.run(m.id, m.date, m.status, m.winning_team || null, m.created_at, m.completed_at || null);
      }
    }

    // Import match_players
    if (body.match_players?.length) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)"
      );
      for (const mp of body.match_players) {
        stmt.run(mp.match_id, mp.player_id, mp.team);
      }
    }

    // Import config
    if (body.config?.length) {
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, ?)"
      );
      for (const cfg of body.config) {
        stmt.run(cfg.key, cfg.value, cfg.updated_at);
      }
    }

    db.exec("COMMIT");
    return c.json({ success: true });
  } catch (err) {
    db.exec("ROLLBACK");
    return c.json({ error: "Import fejlede" }, 500);
  }
});

export default admin;
