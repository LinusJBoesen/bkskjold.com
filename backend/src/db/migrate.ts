import { getDb } from "../lib/db";
import { schema } from "./schema";

export function migrate(): void {
  const db = getDb();
  // Execute each statement separately for compatibility
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    db.exec(stmt + ";");
  }
  console.log("Database migrated");
}
