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

  // Fix lineup_slots primary key to include is_bench (bench slots share slot_index 0-2 with pitch slots)
  try { await sql.unsafe(`ALTER TABLE lineup_slots DROP CONSTRAINT lineup_slots_pkey`); } catch { /* ok */ }
  try { await sql.unsafe(`ALTER TABLE lineup_slots ADD PRIMARY KEY (formation_id, slot_index, is_bench)`); } catch { /* ok */ }

  console.log("Database migrated");
}
