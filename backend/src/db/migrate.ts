import { sql } from "../lib/db";
import { tables } from "./schema";

export async function migrate(): Promise<void> {
  for (const stmt of tables) {
    await sql.unsafe(stmt);
  }

  // Add event_date column to training_lineups if it doesn't exist (migration)
  await sql.unsafe(`ALTER TABLE training_lineups ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ`).catch(() => {});

  // Bootstrap admin user from env vars if no admin exists in DB
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    if (existing.length === 0) {
      const hash = await Bun.password.hash(adminPassword, "bcrypt");
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO users (id, name, email, password_hash, role, approved)
        VALUES (${id}, ${'Admin'}, ${adminEmail}, ${hash}, ${'admin'}, ${1})
        ON CONFLICT (email) DO NOTHING
      `;
      console.log("Admin user bootstrapped from env vars");
    }
  }

  // Create bodekasse_expenses table if it doesn't exist (migration for existing DBs)
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS bodekasse_expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`).catch(() => {});

  // Add score columns to matches if they don't exist
  try {
    await sql`ALTER TABLE matches ADD COLUMN score_team1 INTEGER`;
  } catch { /* column already exists */ }
  try {
    await sql`ALTER TABLE matches ADD COLUMN score_team2 INTEGER`;
  } catch { /* column already exists */ }

  // Fix training_loss fine amount to 10 kr
  await sql`UPDATE fine_types SET amount = 10 WHERE id = 'training_loss'`.catch(() => {});

  // Add winner column to training_lineups for recording training match result
  await sql.unsafe(`ALTER TABLE training_lineups ADD COLUMN IF NOT EXISTS winner INTEGER`).catch(() => {});

  // Add match_lineups table for official match squad (starters + bench)
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS match_lineups (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    starters TEXT NOT NULL,
    bench TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`).catch(() => {});

  // Add location and end_time columns to spond_events
  try { await sql`ALTER TABLE spond_events ADD COLUMN end_time TEXT`; } catch { /* exists */ }
  try { await sql`ALTER TABLE spond_events ADD COLUMN location_name TEXT`; } catch { /* exists */ }
  try { await sql`ALTER TABLE spond_events ADD COLUMN location_address TEXT`; } catch { /* exists */ }

  // Add dbu_match_id column to dbu_matches for linking to per-match detail pages
  try { await sql`ALTER TABLE dbu_matches ADD COLUMN dbu_match_id TEXT`; } catch { /* exists */ }

  // Add time and venue columns to dbu_matches
  try { await sql`ALTER TABLE dbu_matches ADD COLUMN time TEXT`; } catch { /* exists */ }
  try { await sql`ALTER TABLE dbu_matches ADD COLUMN venue TEXT`; } catch { /* exists */ }

  // Add context column to lineup_formations to distinguish training vs match formations
  await sql.unsafe(`ALTER TABLE lineup_formations ADD COLUMN IF NOT EXISTS context TEXT DEFAULT 'match'`).catch(() => {});

  // Fix lineup_slots primary key to include is_bench (bench slots share slot_index 0-2 with pitch slots)
  try { await sql.unsafe(`ALTER TABLE lineup_slots DROP CONSTRAINT lineup_slots_pkey`); } catch { /* ok */ }
  try { await sql.unsafe(`ALTER TABLE lineup_slots ADD PRIMARY KEY (formation_id, slot_index, is_bench)`); } catch { /* ok */ }

  // Drop legacy fake "BK Skjold" / Vanløse IF dev-seed matches (dbu_match_id 900001-900104).
  // The DBU sync replaces real rows by team_id, but never these 9000xx ids.
  await sql`DELETE FROM dbu_team_matches WHERE dbu_match_id LIKE '9000%' OR dbu_match_id LIKE '9001%'`.catch(() => {});

  // Add goal_events column to dbu_match_info for per-event goal detail (scorer + assist).
  await sql.unsafe(`ALTER TABLE dbu_match_info ADD COLUMN IF NOT EXISTS goal_events TEXT`).catch(() => {});

  console.log("Database migrated");
}
