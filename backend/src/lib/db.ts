// PostgreSQL via Bun.sql
// Bun auto-loads .env from cwd; DATABASE_URL may also be set by Railway/hosting
export const sql = new Bun.SQL({
  url: process.env.DATABASE_URL || "postgres://localhost:5432/skjold",
});
