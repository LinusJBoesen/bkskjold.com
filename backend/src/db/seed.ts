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

  // Seed dbu_team_matches for development (our team + opponents)
  const dbuTeamMatches = [
    { dbu_match_id: "900001_489363", team_id: "460174_489363", date: "2025-03-15", time: "14:00", home_team: "BK Skjold", home_team_id: "460174_489363", away_team: "Vanløse IF", away_team_id: "460175_489363", home_score: 3, away_score: 1, venue: "Østerbro Stadion" },
    { dbu_match_id: "900002_489363", team_id: "460174_489363", date: "2025-03-08", time: "15:00", home_team: "Husum BK", home_team_id: "460176_489363", away_team: "BK Skjold", away_team_id: "460174_489363", home_score: 1, away_score: 2, venue: "Husum Idrætsanlæg" },
    { dbu_match_id: "900003_489363", team_id: "460174_489363", date: "2025-03-01", time: "13:00", home_team: "BK Skjold", home_team_id: "460174_489363", away_team: "FC Nordvest", away_team_id: "460177_489363", home_score: 0, away_score: 1, venue: "Østerbro Stadion" },
    { dbu_match_id: "900004_489363", team_id: "460174_489363", date: "2025-02-22", time: "14:00", home_team: "Brønshøj BK", home_team_id: "460178_489363", away_team: "BK Skjold", away_team_id: "460174_489363", home_score: 0, away_score: 4, venue: "Brønshøj Stadion" },
    { dbu_match_id: "900005_489363", team_id: "460174_489363", date: "2025-02-15", time: "11:00", home_team: "BK Skjold", home_team_id: "460174_489363", away_team: "Nørrebro United", away_team_id: "460179_489363", home_score: 2, away_score: 2, venue: "Østerbro Stadion" },
  ];

  for (const tm of dbuTeamMatches) {
    await sql`
      INSERT INTO dbu_team_matches (dbu_match_id, team_id, date, time, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue)
      VALUES (${tm.dbu_match_id}, ${tm.team_id}, ${tm.date}, ${tm.time}, ${tm.home_team}, ${tm.home_team_id}, ${tm.away_team}, ${tm.away_team_id}, ${tm.home_score}, ${tm.away_score}, ${tm.venue})
      ON CONFLICT (dbu_match_id) DO NOTHING
    `;
  }

  // Seed opponent team matches (Vanløse IF) for common opponents testing
  const vanlosMatches = [
    { dbu_match_id: "900101_489363", team_id: "460175_489363", date: "2025-03-12", time: "19:00", home_team: "Vanløse IF", home_team_id: "460175_489363", away_team: "FC Nordvest", away_team_id: "460177_489363", home_score: 1, away_score: 2, venue: "Vanløse Idrætspark" },
    { dbu_match_id: "900102_489363", team_id: "460175_489363", date: "2025-03-05", time: "18:00", home_team: "Husum BK", home_team_id: "460176_489363", away_team: "Vanløse IF", away_team_id: "460175_489363", home_score: 0, away_score: 1, venue: "Husum Idrætsanlæg" },
    { dbu_match_id: "900103_489363", team_id: "460175_489363", date: "2025-02-26", time: "14:00", home_team: "Vanløse IF", home_team_id: "460175_489363", away_team: "Brønshøj BK", away_team_id: "460178_489363", home_score: 3, away_score: 0, venue: "Vanløse Idrætspark" },
    { dbu_match_id: "900104_489363", team_id: "460175_489363", date: "2025-02-19", time: "15:00", home_team: "Nørrebro United", home_team_id: "460179_489363", away_team: "Vanløse IF", away_team_id: "460175_489363", home_score: 1, away_score: 1, venue: "Nørrebro Park" },
  ];

  for (const tm of vanlosMatches) {
    await sql`
      INSERT INTO dbu_team_matches (dbu_match_id, team_id, date, time, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue)
      VALUES (${tm.dbu_match_id}, ${tm.team_id}, ${tm.date}, ${tm.time}, ${tm.home_team}, ${tm.home_team_id}, ${tm.away_team}, ${tm.away_team_id}, ${tm.home_score}, ${tm.away_score}, ${tm.venue})
      ON CONFLICT (dbu_match_id) DO NOTHING
    `;
  }

  console.log("✓ Database initialized");
}
