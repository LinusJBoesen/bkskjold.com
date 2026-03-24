import { getDb } from "../lib/db";
import { schema } from "./schema";

export function migrate(): void {
  const db = getDb();
  db.exec(schema);
  console.log("✓ Database migrated");
}
