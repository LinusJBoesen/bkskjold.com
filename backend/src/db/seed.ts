import { sql } from "../lib/db";

export async function seed(): Promise<void> {
  // System fine types (these are part of the app logic, not test data)
  const fineTypes = [
    { id: "missing_match", name: "Manglende kamp", amount: 100, description: "Ikke mødt til kamp", is_system: 1 },
    { id: "missing_training", name: "Manglende træning", amount: 30, description: "Ikke mødt til træning", is_system: 1 },
    { id: "no_response_24h", name: "Intet svar 24t", amount: 60, description: "Ikke svaret inden for 24 timer", is_system: 1 },
    { id: "training_loss", name: "Tabt træning", amount: 25, description: "Tabte holdets træningsmatch", is_system: 1 },
  ];

  for (const ft of fineTypes) {
    await sql`
      INSERT INTO fine_types (id, name, amount, description, is_system)
      VALUES (${ft.id}, ${ft.name}, ${ft.amount}, ${ft.description}, ${ft.is_system})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // Default config values
  const configValues = [
    { key: "spond_group_id", value: "" },
    { key: "late_response_hours", value: "24" },
  ];

  for (const cfg of configValues) {
    await sql`
      INSERT INTO config (key, value)
      VALUES (${cfg.key}, ${cfg.value})
      ON CONFLICT (key) DO NOTHING
    `;
  }

  console.log("✓ Database initialized");
}
