import { getDb } from "../lib/db";

export function seed(): void {
  const db = getDb();

  // System fine types (these are part of the app logic, not test data)
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

  console.log("✓ Database initialized");
}
