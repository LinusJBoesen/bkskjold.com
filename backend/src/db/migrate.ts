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

  console.log("Database migrated");
}
