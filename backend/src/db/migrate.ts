import { sql } from "../lib/db";
import { tables } from "./schema";

export async function migrate(): Promise<void> {
  for (const stmt of tables) {
    await sql.unsafe(stmt);
  }
  console.log("Database migrated");
}
