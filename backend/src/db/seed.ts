import { sql } from "../lib/db";

export async function seed(): Promise<void> {
  // System fine types (these are part of the app logic, not test data)
  const fineTypes = [
    { id: "missing_match", name: "Manglende kamp", amount: 100, description: "Ikke mødt til kamp", is_system: 1 },
    { id: "missing_training", name: "Manglende træning", amount: 30, description: "Ikke mødt til træning", is_system: 1 },
    { id: "no_response_24h", name: "Intet svar 24t", amount: 60, description: "Ikke svaret inden for 24 timer", is_system: 1 },
    { id: "training_loss", name: "Tabt træning", amount: 10, description: "Tabte holdets træningsmatch", is_system: 1 },
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

  // Seed Spond events with location data for development
  const spondEvents = [
    {
      id: "spond-evt-1",
      name: "Træning",
      start_time: "2026-04-15T18:00:00.000Z",
      end_time: "2026-04-15T19:30:00.000Z",
      event_type: "RECURRING",
      location_name: "Østerbro Stadion",
      location_address: "Gunnar Nu Hansens Plads 7, 2100 København Ø",
    },
    {
      id: "spond-evt-2",
      name: "Kamp vs. Frem",
      start_time: "2026-04-20T14:00:00.000Z",
      end_time: "2026-04-20T16:00:00.000Z",
      event_type: "EVENT",
      location_name: "Valby Idrætspark",
      location_address: "Hammelstrupvej 38, 2450 København SV",
    },
    {
      id: "spond-evt-3",
      name: "Kamp vs. AB",
      start_time: "2026-04-27T11:00:00.000Z",
      end_time: "2026-04-27T13:00:00.000Z",
      event_type: "EVENT",
      location_name: "Østerbro Stadion",
      location_address: "Gunnar Nu Hansens Plads 7, 2100 København Ø",
    },
  ];

  for (const evt of spondEvents) {
    await sql`
      INSERT INTO spond_events (id, name, start_time, end_time, event_type, location_name, location_address, synced_at)
      VALUES (${evt.id}, ${evt.name}, ${evt.start_time}, ${evt.end_time}, ${evt.event_type}, ${evt.location_name}, ${evt.location_address}, NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log("✓ Database initialized");
}
