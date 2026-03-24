# Skjold Bode Rebuild — PRD

## Goal

Rebuild the BK Skjold football team management app as a modern Bun + TypeScript web application with:
- Hono REST API backend with SQLite database
- React + shadcn/ui frontend with TailwindCSS
- Playwright E2E tests gating every round
- All UI in Danish

## Previous App Reference

The previous Python/Streamlit app (github.com/LinusJBoesen/bkskjold) had these features:
- **Dashboard**: Top performers, training stats charts, fines charts, Spond sync
- **Fine Management (Bødeoversigt)**: Player fine overview, detail view, auto-fines from Spond, manual fines, mark as paid
- **Team Selector (Hold Udvælger)**: Auto-populate from Spond, guest players, balanced team generation (greedy + optimal algorithms), player swap, save as pending match
- **Training History (Træningshistorik)**: Pending matches, result registration, player stats, match history, CSV export
- **Tournament (Turnering)**: DBU league standings scraped from website
- **Match Analysis (Kampanalyse)**: DBU matches cross-referenced with Spond attendance
- **Admin Panel**: Config management, fine type CRUD, data export

**Integrations**: Spond API (events, members, attendance), DBU website scraping (standings, matches)

## Database Schema

```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_picture TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE fine_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE fines (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id),
  fine_type_id TEXT NOT NULL REFERENCES fine_types(id),
  event_id TEXT,
  event_name TEXT,
  event_date TEXT,
  amount INTEGER NOT NULL,
  paid INTEGER NOT NULL DEFAULT 0,
  paid_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, event_id, fine_type_id)
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  winning_team INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE match_players (
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id),
  team INTEGER NOT NULL,
  PRIMARY KEY (match_id, player_id)
);

CREATE TABLE spond_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  event_type TEXT,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE spond_attendance (
  event_id TEXT NOT NULL REFERENCES spond_events(id),
  player_id TEXT NOT NULL REFERENCES players(id),
  response TEXT,
  responded_at TEXT,
  PRIMARY KEY (event_id, player_id)
);

CREATE TABLE dbu_standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goal_diff TEXT,
  points INTEGER DEFAULT 0,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE dbu_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

System fine types to seed:

| id | name | amount | description |
|----|------|--------|-------------|
| missing_match | Manglende kamp | 100 | Ikke mødt til kamp |
| missing_training | Manglende træning | 30 | Ikke mødt til træning |
| no_response_24h | Intet svar 24t | 60 | Ikke svaret inden for 24 timer |
| training_loss | Tabt træning | 25 | Tabte holdets træningsmatch |

---

## Round 1: Project Scaffolding + Database

Set up the entire project skeleton so both servers start and the database is created.

- [ ] Initialize backend: `bun init` in `backend/`, add Hono dependency
- [ ] Create `backend/src/index.ts` with Hono app, `GET /api/health` returning `{ status: "ok" }`, `Bun.serve()` on port 3000
- [ ] Create `backend/src/db/schema.ts` with all CREATE TABLE statements from above
- [ ] Create `backend/src/db/migrate.ts` that runs schema on startup, creates `backend/data/skjold.db`
- [ ] Create `backend/src/db/seed.ts` that inserts system fine types + test data (players, fines, matches)
- [ ] Create `backend/src/lib/db.ts` — SQLite singleton using `bun:sqlite`
- [ ] Wire migration into `backend/src/index.ts` (run on startup)
- [ ] Initialize frontend: Vite + React + TypeScript in `frontend/`
- [ ] Install and configure TailwindCSS in frontend
- [ ] Install shadcn/ui in frontend (init + add button, card, input, table components)
- [ ] Create `frontend/vite.config.ts` with API proxy to `http://localhost:3000`
- [ ] Create root-level dev script or `package.json` to start both servers
- [ ] Update `e2e/playwright.config.ts`: webServer starts both backend + frontend, baseURL `http://localhost:5173`
- [ ] Create `e2e/specs/health/api-health.spec.ts` — test that `/api/health` returns 200 with `{ status: "ok" }`
- [ ] Add `backend/data/` to `.gitignore`
- [ ] Create `.env.example` with placeholder env vars

**Acceptance**: `bun run dev` (or equivalent) starts both servers. SQLite database is created with all tables. `cd e2e && npx playwright test specs/health/` passes.

- [ ] Commit: `feat(skjold): project scaffolding with Bun + Hono + React + SQLite`

---

## Round 2: Auth + Layout Shell

- [ ] Create `.env` with `ADMIN_EMAIL` and `ADMIN_PASSWORD` (use test values for dev)
- [ ] Create `backend/src/routes/auth.ts`: `POST /api/auth/login` validates credentials from env, sets session cookie; `POST /api/auth/logout` clears cookie
- [ ] Create `backend/src/middleware/auth.ts`: middleware that checks session cookie, returns 401 if invalid
- [ ] Protect all `/api/*` routes except `/api/health` and `/api/auth/login`
- [ ] Create `frontend/src/pages/login.tsx` with email + password form, Danish labels ("E-mail", "Adgangskode", "Log ind")
- [ ] Create `frontend/src/hooks/use-auth.ts` — auth state, login/logout functions
- [ ] Create `frontend/src/components/layout/sidebar.tsx` with Danish navigation:
  - Oversigt (Dashboard)
  - Bødeoversigt (Fines)
  - Hold Udvælger (Team Selector)
  - Træningshistorik (Training History)
  - Turnering (Tournament)
  - Kampanalyse (Match Analysis)
  - Admin
- [ ] Create `frontend/src/components/layout/header.tsx` with logout button
- [ ] Create `frontend/src/App.tsx` with React Router, protected routes, layout wrapper
- [ ] Create stub pages for all nav items (just title + "Kommer snart" placeholder)
- [ ] Create `frontend/src/i18n/da.ts` with all Danish strings
- [ ] Create `e2e/fixtures/test-data.ts` with test credentials
- [ ] Create `e2e/fixtures/auth.fixture.ts` extending `@playwright/test` with `authenticatedPage` fixture
- [ ] Create `e2e/fixtures/pages/login.page.ts` page object
- [ ] Create `e2e/specs/auth/login.spec.ts` — form visibility, valid login → dashboard, invalid login → error
- [ ] Create `e2e/specs/layout/navigation.spec.ts` — sidebar items visible, navigation works

**Acceptance**: Login form works with env credentials. Sidebar shows all nav items in Danish. Unauthenticated API requests return 401. All auth + layout E2E tests pass.

- [ ] Commit: `feat(skjold): auth with session cookies and layout shell with Danish nav`

---

## Round 3: Players + Spond Sync

- [ ] Create `backend/src/services/spond.ts` — Spond API client class:
  - `authenticate()`: Login with Spond credentials from env (`SPOND_USERNAME`, `SPOND_PASSWORD`)
  - `getGroupMembers(groupId)`: Fetch all members with profile pictures
  - `getEvents(groupId, daysBack)`: Fetch events from last N days
  - `getEventAttendance(eventId)`: Get attendance/response data
  - `getNextTrainingAccepted(groupId)`: Get players who accepted next training
- [ ] Add Spond env vars to `.env.example`: `SPOND_USERNAME`, `SPOND_PASSWORD`, `SPOND_GROUP_ID`
- [ ] Create `backend/src/routes/players.ts`: `GET /api/players` returns all active players
- [ ] Create `backend/src/routes/sync.ts`: `POST /api/sync/spond` triggers full sync (members → players table, events → spond_events table, attendance → spond_attendance table)
- [ ] Create `frontend/src/pages/dashboard.tsx` with sync button ("Synkronisér Data")
- [ ] Show player count and last sync time on dashboard
- [ ] Create `e2e/specs/sync/spond-sync.spec.ts` — sync button visible, clicking shows loading state and feedback (use seeded data, mock external API if needed)

**Acceptance**: Sync button triggers Spond data pull. Players table is populated. Player list endpoint returns synced data. E2E sync test passes.

- [ ] Commit: `feat(skjold): Spond API integration and player sync`

---

## Round 4: Fine Management (Bødeoversigt)

- [ ] Create `backend/src/services/fines.ts` — fine calculation logic:
  - `calculateEventFines(event, attendance, members)`: Determine fines for an event (missing_match 100kr, missing_training 30kr, no_response_24h 60kr)
  - `generateAutoFines()`: Process all synced events and create fine records
- [ ] Create `backend/src/routes/fines.ts`:
  - `GET /api/fines` — all fines with player info, supports `?player_id=` filter
  - `GET /api/fines/summary` — aggregated per-player totals (total, paid, unpaid)
  - `POST /api/fines` — create manual fine (player_id, fine_type_id, amount, notes)
  - `PATCH /api/fines/:id/pay` — mark fine as paid
  - `DELETE /api/fines/:id` — remove a fine
  - `GET /api/fine-types` — list all fine types
  - `POST /api/fine-types` — create custom fine type
  - `PUT /api/fine-types/:id` — update fine type
  - `DELETE /api/fine-types/:id` — delete fine type (only non-system)
- [ ] Create `frontend/src/pages/fines/overview.tsx`:
  - Table of all players with: Name, Total bøder, Betalt, Ubetalt
  - Click player → navigate to detail
- [ ] Create `frontend/src/pages/fines/detail.tsx`:
  - Player name and total summary at top
  - Table: Dato, Begivenhed, Type, Beløb, Status, Actions
  - "Markér betalt" button per fine
  - "Tilføj bøde" button → form with fine type + amount
- [ ] Create `frontend/src/lib/api.ts` — typed fetch wrapper with auth cookie
- [ ] Create page objects: `e2e/fixtures/pages/fine-overview.page.ts`, `fine-detail.page.ts`
- [ ] Create `e2e/specs/fines/fine-overview.spec.ts` — table renders with player data
- [ ] Create `e2e/specs/fines/fine-detail.spec.ts` — detail view shows fine history
- [ ] Create `e2e/specs/fines/fine-create.spec.ts` — manual fine creation works
- [ ] Create `e2e/specs/fines/fine-pay.spec.ts` — marking fine as paid updates UI

**Acceptance**: Fine overview shows all players with totals. Detail view shows individual fines. Manual fine creation and mark-as-paid work. All fine E2E tests pass.

- [ ] Commit: `feat(skjold): fine management with auto-generation and manual CRUD`

---

## Round 5: Team Selector (Hold Udvælger)

- [ ] Create `backend/src/services/team-generator.ts`:
  - `calculatePlayerStats()`: Build win/loss stats from matches table
  - `getPlayerWinRate(playerId)`: Return win rate (default 0.5 for new players)
  - `generateBalancedTeams(players, algorithm)`: Generate two balanced teams
    - Greedy: Sort by win rate, alternate assignment
    - Optimal: Sample combinations, find best balance
  - `getTeamBalance(team1, team2)`: Return balance metrics (strength diff, balance %)
- [ ] Create `backend/src/routes/teams.ts`:
  - `POST /api/teams/generate` — accepts player IDs + algorithm, returns two teams with balance metrics
  - `POST /api/teams/swap` — swap a player between teams, return updated balance
  - `GET /api/teams/available` — players who accepted next training (from Spond data)
- [ ] Create `frontend/src/pages/teams/selector.tsx`:
  - Available players list (auto-populated from Spond accepted + manual add)
  - "Tilføj gæst" input for external players
  - "Generer hold" button with balance metrics display
  - Two team columns showing players with win rates
  - Swap button (🔄) per player
  - "Gem kamp" button → saves as pending match
- [ ] Create page objects: `e2e/fixtures/pages/team-selector.page.ts`
- [ ] Create `e2e/specs/teams/team-selector.spec.ts` — player list loads, team generation produces two teams
- [ ] Create `e2e/specs/teams/team-save.spec.ts` — saving creates a pending match

**Acceptance**: Teams can be generated with balance metrics. Players can be swapped. Matches saved as pending. All team E2E tests pass.

- [ ] Commit: `feat(skjold): team selector with balanced generation algorithms`

---

## Round 6: Training History (Træningshistorik)

- [ ] Create `backend/src/routes/matches.ts`:
  - `GET /api/matches` — all matches with player data, supports `?status=pending|completed`
  - `GET /api/matches/:id` — single match detail
  - `POST /api/matches` — create match (used by team selector)
  - `PATCH /api/matches/:id/result` — register result (winning_team: 1|2), auto-creates training_loss fines for losing team
  - `DELETE /api/matches/:id` — delete pending match
  - `GET /api/matches/stats` — player statistics (matches, wins, losses, win rate)
  - `GET /api/matches/export/csv` — CSV export
- [ ] Create `frontend/src/pages/history/training.tsx`:
  - Pending matches section with "Hold 1 Vandt" / "Hold 2 Vandt" buttons
  - Player statistics table: Navn, Kampe, Sejre, Nederlag, Sejrsrate (color coded)
  - Match history with filter (Alle / Seneste 10 / Seneste 20) and sort (Nyeste / Ældste)
  - "Eksportér CSV" button
- [ ] Wire result registration to auto-create training_loss fines (25kr per player on losing team)
- [ ] Create page objects: `e2e/fixtures/pages/training-history.page.ts`
- [ ] Create `e2e/specs/history/pending-matches.spec.ts` — pending match shows, result can be registered
- [ ] Create `e2e/specs/history/player-stats.spec.ts` — stats table renders correctly
- [ ] Create `e2e/specs/history/match-history.spec.ts` — history list with filtering

**Acceptance**: Full match lifecycle works: pending → result → completed. Stats update correctly. Training loss fines auto-generated. CSV export works. All history E2E tests pass.

- [ ] Commit: `feat(skjold): training history with result registration and auto-fines`

---

## Round 7: Dashboard with Charts

- [ ] Create `backend/src/routes/stats.ts`:
  - `GET /api/stats/dashboard` — returns:
    - Top 3: most wins, best win rate, highest fines
    - Training chart data: wins vs losses per player
    - Fine chart data: paid vs unpaid, breakdown by type
    - Totals: total players, total fines amount, paid amount
- [ ] Create `frontend/src/pages/dashboard.tsx` (expand existing):
  - Top 3 performers cards with player photos
  - Training stats: stacked bar chart (wins vs losses), win rate chart (color coded)
  - Fine stats: stacked bar (paid vs unpaid per player), pie chart by fine type
  - Sync button (already exists from Round 3)
- [ ] Install Recharts in frontend
- [ ] Create page objects: `e2e/fixtures/pages/dashboard.page.ts`
- [ ] Create `e2e/specs/dashboard/dashboard-stats.spec.ts` — top performers render, charts visible

**Acceptance**: Dashboard shows meaningful statistics and charts with seeded data. Top performers correctly calculated. All dashboard E2E tests pass.

- [ ] Commit: `feat(skjold): dashboard with stats cards and Recharts visualizations`

---

## Round 8: Tournament + Match Analysis

- [ ] Create `backend/src/services/dbu.ts` — DBU scraper:
  - `fetchStandings()`: Scrape league standings from DBU website (use `node-html-parser` or similar)
  - `fetchMatchResults()`: Scrape match results
  - Cache results for 1 hour
- [ ] Create `backend/src/routes/sync.ts` (extend): `POST /api/sync/dbu` triggers DBU data refresh
- [ ] Add routes for standings and analysis:
  - `GET /api/tournament/standings` — return cached standings
  - `GET /api/analysis/player-rates` — cross-reference DBU matches with Spond attendance for individual player win rates
- [ ] Create `frontend/src/pages/tournament/standings.tsx`:
  - League table: Position, Hold, Kampe, S/U/T, Målforskel, Point
  - Color coding: green top 2, blue middle, red bottom
  - "Opdatér" button to refresh
- [ ] Create `frontend/src/pages/analysis/match.tsx`:
  - Player match win rates from official matches
  - Cross-referenced with Spond attendance
- [ ] Create page objects and specs
- [ ] Create `e2e/specs/tournament/standings.spec.ts` — standings table renders with color coding
- [ ] Create `e2e/specs/analysis/match-analysis.spec.ts` — analysis page shows data

**Acceptance**: DBU standings displayed with color coding. Match analysis cross-references work. All tournament + analysis E2E tests pass.

- [ ] Commit: `feat(skjold): tournament standings and match analysis with DBU scraping`

---

## Round 9: Admin Panel

- [ ] Create `backend/src/routes/admin.ts`:
  - `GET /api/admin/config` — read all config values
  - `PUT /api/admin/config/:key` — update config value
  - `GET /api/admin/export` — full database export as JSON
  - `POST /api/admin/import` — import JSON data
- [ ] Create `frontend/src/pages/admin/settings.tsx` with tabs:
  - **Konfiguration**: Display and edit system config (Spond group ID, fine amounts, late response threshold)
  - **Bødetyper**: Fine type CRUD — list all types, create new ("Navn", "Beløb"), edit, delete (only custom types)
  - **Data**: Export button (download JSON), import button (upload JSON)
- [ ] Create page objects and specs
- [ ] Create `e2e/specs/admin/fine-types.spec.ts` — CRUD for custom fine types
- [ ] Create `e2e/specs/admin/settings.spec.ts` — config values readable and editable

**Acceptance**: Admin can manage fine types, export/import data, update config. All admin E2E tests pass.

- [ ] Commit: `feat(skjold): admin panel with config, fine types, and data management`

---

## Round 10: Polish + Integration

- [ ] Responsive design pass: all pages work on mobile (375px viewport)
- [ ] Add loading states (skeleton/spinner) for all data-fetching pages
- [ ] Add error handling: API error toasts, network failure states
- [ ] Add empty states for all list views ("Ingen bøder endnu", "Ingen kampe endnu", etc.)
- [ ] Add toast notifications for actions (fine paid, teams saved, sync complete)
- [ ] Create `e2e/specs/integration/full-flow.spec.ts`:
  - Login → dashboard → sync (with seeded data) → view fines → create manual fine → generate teams → save match → register result → view dashboard stats
- [ ] Update `CLAUDE.md` with complete project documentation (tech stack, dev setup, folder structure)
- [ ] Verify all E2E specs pass: `cd e2e && npx playwright test`

**Acceptance**: App is responsive on mobile. All pages have loading/error/empty states. Full integration E2E test passes. All individual specs pass.

- [ ] Commit: `feat(skjold): polish — responsive design, states, and full integration test`

---

## Success Criteria

ALL of the following must be true:

1. Backend starts on port 3000 with all API endpoints working
2. Frontend starts on port 5173 with all pages rendering
3. SQLite database created with correct schema on startup
4. Login works with env-based credentials
5. All 10 rounds completed with all tasks checked
6. All E2E specs pass: `cd e2e && npx playwright test`
7. Full integration test passes end-to-end
8. All UI text is in Danish
