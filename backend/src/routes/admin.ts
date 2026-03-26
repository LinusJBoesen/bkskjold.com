import { Hono } from "hono";
import { sql } from "../lib/db";

const admin = new Hono();

// GET /api/admin/config — read all config values
admin.get("/config", async (c) => {
  const rows = await sql`SELECT * FROM config ORDER BY key`;
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

  await sql`
    INSERT INTO config (key, value, updated_at) VALUES (${key}, ${String(value)}, NOW())
    ON CONFLICT(key) DO UPDATE SET value = ${String(value)}, updated_at = NOW()
  `;

  return c.json({ success: true });
});

// GET /api/admin/export — full database export as JSON
admin.get("/export", async (c) => {
  const data = {
    players: await sql`SELECT * FROM players`,
    fine_types: await sql`SELECT * FROM fine_types`,
    fines: await sql`SELECT * FROM fines`,
    matches: await sql`SELECT * FROM matches`,
    match_players: await sql`SELECT * FROM match_players`,
    spond_events: await sql`SELECT * FROM spond_events`,
    spond_attendance: await sql`SELECT * FROM spond_attendance`,
    dbu_standings: await sql`SELECT * FROM dbu_standings`,
    dbu_matches: await sql`SELECT * FROM dbu_matches`,
    config: await sql`SELECT * FROM config`,
    exported_at: new Date().toISOString(),
  };

  return c.json(data);
});

// POST /api/admin/import — import JSON data
admin.post("/import", async (c) => {
  const body = await c.req.json();

  try {
    await sql.begin(async (tx) => {
      // Clear non-system data
      await tx`DELETE FROM spond_attendance`;
      await tx`DELETE FROM spond_events`;
      await tx`DELETE FROM match_players`;
      await tx`DELETE FROM fines`;
      await tx`DELETE FROM matches`;
      await tx`DELETE FROM dbu_standings`;
      await tx`DELETE FROM dbu_matches`;
      await tx`DELETE FROM fine_types WHERE is_system = 0`;
      await tx`DELETE FROM players`;
      await tx`DELETE FROM config`;

      // Import players
      if (body.players?.length) {
        for (const p of body.players) {
          await tx`
            INSERT INTO players (id, first_name, last_name, display_name, profile_picture, active, created_at, updated_at)
            VALUES (${p.id}, ${p.first_name}, ${p.last_name}, ${p.display_name}, ${p.profile_picture || null}, ${p.active ?? 1}, ${p.created_at}, ${p.updated_at})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      // Import custom fine types
      if (body.fine_types?.length) {
        for (const ft of body.fine_types) {
          await tx`
            INSERT INTO fine_types (id, name, amount, description, is_system, created_at)
            VALUES (${ft.id}, ${ft.name}, ${ft.amount}, ${ft.description || null}, ${ft.is_system}, ${ft.created_at})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      // Import fines
      if (body.fines?.length) {
        for (const f of body.fines) {
          await tx`
            INSERT INTO fines (id, player_id, fine_type_id, amount, paid, paid_date, notes, event_id, event_name, event_date, created_at)
            VALUES (${f.id}, ${f.player_id}, ${f.fine_type_id}, ${f.amount}, ${f.paid}, ${f.paid_date || null}, ${f.notes || null}, ${f.event_id || null}, ${f.event_name || null}, ${f.event_date || null}, ${f.created_at})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      // Import matches
      if (body.matches?.length) {
        for (const m of body.matches) {
          await tx`
            INSERT INTO matches (id, date, status, winning_team, created_at, completed_at)
            VALUES (${m.id}, ${m.date}, ${m.status}, ${m.winning_team || null}, ${m.created_at}, ${m.completed_at || null})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      // Import match_players
      if (body.match_players?.length) {
        for (const mp of body.match_players) {
          await tx`
            INSERT INTO match_players (match_id, player_id, team)
            VALUES (${mp.match_id}, ${mp.player_id}, ${mp.team})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      // Import config
      if (body.config?.length) {
        for (const cfg of body.config) {
          await tx`
            INSERT INTO config (key, value, updated_at)
            VALUES (${cfg.key}, ${cfg.value}, ${cfg.updated_at})
            ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
          `;
        }
      }
    });

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Import fejlede" }, 500);
  }
});

export default admin;
