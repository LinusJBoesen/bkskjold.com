export const tables = [
  `CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    profile_picture TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS fine_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS fines (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id),
    fine_type_id TEXT NOT NULL REFERENCES fine_types(id),
    event_id TEXT,
    event_name TEXT,
    event_date TEXT,
    amount INTEGER NOT NULL,
    paid INTEGER NOT NULL DEFAULT 0,
    paid_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, event_id, fine_type_id)
  )`,

  `CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    winning_team INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  )`,

  `CREATE TABLE IF NOT EXISTS match_players (
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id),
    team INTEGER NOT NULL,
    PRIMARY KEY (match_id, player_id)
  )`,

  `CREATE TABLE IF NOT EXISTS spond_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    event_type TEXT,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS spond_attendance (
    event_id TEXT NOT NULL REFERENCES spond_events(id),
    player_id TEXT NOT NULL REFERENCES players(id),
    response TEXT,
    responded_at TEXT,
    PRIMARY KEY (event_id, player_id)
  )`,

  `CREATE TABLE IF NOT EXISTS dbu_standings (
    id SERIAL PRIMARY KEY,
    position INTEGER NOT NULL,
    team_name TEXT NOT NULL,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goal_diff TEXT,
    points INTEGER DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS dbu_matches (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','spiller','fan')) DEFAULT 'fan',
    player_id TEXT REFERENCES players(id),
    approved INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS player_positions (
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    position TEXT NOT NULL CHECK(position IN ('keeper','defender','wing','midfield','attacker')),
    PRIMARY KEY (player_id, position)
  )`,

  `CREATE TABLE IF NOT EXISTS match_events (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id),
    event_type TEXT NOT NULL CHECK(event_type IN ('goal','assist','yellow_card','red_card','clean_sheet')),
    minute INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS fan_signups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    position TEXT,
    comment TEXT,
    love_level INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS bodekasse_expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS lineup_formations (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    team_number INTEGER NOT NULL CHECK(team_number IN (1, 2)),
    formation TEXT NOT NULL CHECK(formation IN ('1-2-3-1','1-3-2-1','1-3-3')),
    context TEXT NOT NULL DEFAULT 'match',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS training_lineups (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    team1 TEXT NOT NULL,
    team2 TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS match_lineups (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    starters TEXT NOT NULL,
    bench TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS lineup_slots (
    formation_id TEXT NOT NULL REFERENCES lineup_formations(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    player_id TEXT REFERENCES players(id),
    position TEXT NOT NULL CHECK(position IN ('keeper','defender','wing','midfield','attacker')),
    is_bench INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (formation_id, slot_index, is_bench)
  )`,
];
