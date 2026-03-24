import { getDb } from "../lib/db";
import { randomUUID } from "crypto";
import { seedDbuData } from "../services/dbu";

export function seed(): void {
  const db = getDb();

  // System fine types
  const fineTypes = [
    { id: "missing_match", name: "Manglende kamp", amount: 100, description: "Ikke mødt til kamp", is_system: 1 },
    { id: "missing_training", name: "Manglende træning", amount: 30, description: "Ikke mødt til træning", is_system: 1 },
    { id: "no_response_24h", name: "Intet svar 24t", amount: 60, description: "Ikke svaret inden for 24 timer", is_system: 1 },
    { id: "training_loss", name: "Tabt træning", amount: 25, description: "Tabte holdets træningsmatch", is_system: 1 },
  ];

  const insertFineType = db.prepare(
    "INSERT OR IGNORE INTO fine_types (id, name, amount, description, is_system) VALUES (?, ?, ?, ?, ?)"
  );
  for (const ft of fineTypes) {
    insertFineType.run(ft.id, ft.name, ft.amount, ft.description, ft.is_system);
  }

  // Test players
  const players = [
    { id: "player-1", first_name: "Anders", last_name: "Jensen", display_name: "Anders J." },
    { id: "player-2", first_name: "Mikkel", last_name: "Nielsen", display_name: "Mikkel N." },
    { id: "player-3", first_name: "Lars", last_name: "Pedersen", display_name: "Lars P." },
    { id: "player-4", first_name: "Christian", last_name: "Hansen", display_name: "Christian H." },
    { id: "player-5", first_name: "Frederik", last_name: "Andersen", display_name: "Frederik A." },
    { id: "player-6", first_name: "Søren", last_name: "Christensen", display_name: "Søren C." },
  ];

  const insertPlayer = db.prepare(
    "INSERT OR IGNORE INTO players (id, first_name, last_name, display_name) VALUES (?, ?, ?, ?)"
  );
  for (const p of players) {
    insertPlayer.run(p.id, p.first_name, p.last_name, p.display_name);
  }

  // Test fines
  const fines = [
    { id: randomUUID(), player_id: "player-1", fine_type_id: "missing_training", amount: 30, paid: 0 },
    { id: randomUUID(), player_id: "player-1", fine_type_id: "no_response_24h", amount: 60, paid: 1 },
    { id: randomUUID(), player_id: "player-2", fine_type_id: "missing_match", amount: 100, paid: 0 },
    { id: randomUUID(), player_id: "player-3", fine_type_id: "training_loss", amount: 25, paid: 0 },
  ];

  const insertFine = db.prepare(
    "INSERT OR IGNORE INTO fines (id, player_id, fine_type_id, amount, paid) VALUES (?, ?, ?, ?, ?)"
  );
  for (const f of fines) {
    insertFine.run(f.id, f.player_id, f.fine_type_id, f.amount, f.paid);
  }

  // Test match
  const matchId = "match-1";
  db.prepare("INSERT OR IGNORE INTO matches (id, date, status) VALUES (?, ?, ?)").run(matchId, "2025-03-20", "pending");

  const insertMatchPlayer = db.prepare("INSERT OR IGNORE INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)");
  insertMatchPlayer.run(matchId, "player-1", 1);
  insertMatchPlayer.run(matchId, "player-2", 1);
  insertMatchPlayer.run(matchId, "player-3", 1);
  insertMatchPlayer.run(matchId, "player-4", 2);
  insertMatchPlayer.run(matchId, "player-5", 2);
  insertMatchPlayer.run(matchId, "player-6", 2);

  // Default config values
  const configValues = [
    { key: "spond_group_id", value: "" },
    { key: "late_response_hours", value: "24" },
    { key: "fine_missing_match", value: "100" },
    { key: "fine_missing_training", value: "30" },
    { key: "fine_no_response", value: "60" },
    { key: "fine_training_loss", value: "25" },
  ];

  const insertConfig = db.prepare(
    "INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)"
  );
  for (const cfg of configValues) {
    insertConfig.run(cfg.key, cfg.value);
  }

  // Seed DBU standings and matches
  seedDbuData();

  console.log("✓ Database seeded");
}
