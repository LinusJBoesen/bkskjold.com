# Skjold Bode — BK Skjold Football Team Management

A web app for BK Skjold football team: fine management, data tracking, team generation, tournament standings, match analysis, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Backend | Hono REST API (port 3000), SQLite via `bun:sqlite` |
| Frontend | React 19 + Vite (port 5173) + TailwindCSS v4 + shadcn/ui |
| Charts | Recharts |
| E2E Tests | Playwright |
| Language | TypeScript, all UI in Danish |

## Development

```bash
# Start both servers (backend + frontend)
bun run dev

# Start individually
cd backend && bun run src/index.ts
cd frontend && bunx vite --port 5173

# Run E2E tests
cd e2e && npx playwright test

# Run specific test file
cd e2e && npx playwright test specs/integration/full-flow.spec.ts
```

## Project Structure

```
backend/src/
  index.ts            — Hono app + Bun.serve() on port 3000
  db/schema.ts        — CREATE TABLE statements
  db/migrate.ts       — Run migrations on startup
  db/seed.ts          — Dev seed data (players, fines, matches, config, DBU)
  routes/             — auth, players, fines, matches, teams, sync, stats, tournament, analysis, admin
  services/           — spond (API client), dbu (scraper), fines, team-generator
  middleware/auth.ts   — Session cookie auth
  lib/db.ts           — SQLite singleton
  lib/types.ts        — Shared types

frontend/src/
  main.tsx, App.tsx    — Entry + React Router with protected routes
  components/ui/       — shadcn/ui (button, card, input, table)
  components/layout/   — Sidebar (responsive), Header (hamburger menu)
  components/toast.tsx — Toast notification system (context-based)
  pages/               — login, dashboard, fines/{overview,detail}, teams/selector,
                         history/training, tournament/standings, analysis/match, admin/settings
  hooks/use-auth.ts    — Auth state management
  lib/api.ts           — Typed API client with credentials
  i18n/da.ts           — Danish strings

e2e/
  playwright.config.ts — Config with webServer for both backend + frontend
  fixtures/            — auth.fixture.ts, test-data.ts, pages/*.page.ts
  specs/               — auth/, dashboard/, fines/, teams/, history/, tournament/,
                         analysis/, admin/, integration/, health/, layout/, sync/
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (public) |
| POST | `/api/auth/login` | Login with env credentials |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Check auth status |
| GET | `/api/players` | List active players |
| POST | `/api/sync/spond` | Sync Spond data |
| POST | `/api/sync/dbu` | Sync DBU standings |
| GET | `/api/fines` | List fines (?player_id filter) |
| GET | `/api/fines/summary` | Per-player fine totals |
| POST | `/api/fines` | Create manual fine |
| PATCH | `/api/fines/:id/pay` | Mark fine as paid |
| DELETE | `/api/fines/:id` | Delete fine |
| GET/POST/PUT/DELETE | `/api/fines/types[/:id]` | Fine type CRUD |
| GET | `/api/matches` | List matches (?status filter) |
| POST | `/api/matches` | Create match |
| PATCH | `/api/matches/:id/result` | Register result + auto-fines |
| DELETE | `/api/matches/:id` | Delete match |
| GET | `/api/matches/stats/all` | Player statistics |
| GET | `/api/matches/export/csv` | CSV export |
| POST | `/api/teams/generate` | Generate balanced teams |
| POST | `/api/teams/swap` | Swap player between teams |
| GET | `/api/teams/available` | Available players with stats |
| GET | `/api/stats/dashboard` | Dashboard aggregation |
| GET | `/api/tournament/standings` | DBU standings |
| GET | `/api/analysis/player-rates` | Match analysis data |
| GET/PUT | `/api/admin/config[/:key]` | Config management |
| GET | `/api/admin/export` | Full DB export as JSON |
| POST | `/api/admin/import` | Import JSON data |

## Auth

Simple env-based credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD` in `.env`), session cookie authentication. All `/api/*` routes protected except `/api/health` and `/api/auth/login`.

## Conventions

- All UI text in Danish (centralized in `frontend/src/i18n/da.ts`)
- E2E tests use Page Object pattern with `data-testid` locators
- data-testid naming: `{domain}-{element}[-{qualifier}]`
- API routes under `/api/`
- Brand colors: Red (#D42428), Black (#1A1A1A), White — see `brand-guidelines.md`
- Responsive design: mobile-first with hamburger sidebar on < lg breakpoint
- Toast notifications for user actions via context-based toast system

## Ralph Loop

This project was built iteratively via a Ralph Loop. See `.ralph/` for:
- `PROMPT.md` — entry prompt for each iteration
- `PRD.md` — acceptance criteria per round
- `progress.txt` — current state and resume info
