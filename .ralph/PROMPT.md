# Skjold Bode Rebuild — Ralph Loop Prompt

## Context

You are rebuilding the BK Skjold football team management app from scratch as a modern Bun + TypeScript web app. Each iteration you start with **fresh context** — read progress.txt first to know where you are.

**IMPORTANT**: Do NOT invoke any skills or slash commands (no /ralph-loop, no /ship, etc.). Just read the files, do the work directly, and commit. You are running headless via `claude -p`.

## Startup Sequence (Every Iteration)

1. **Read** `.ralph/progress.txt` — find your current round and what was last completed
2. **Read** `.ralph/PRD.md` — find acceptance criteria for the current round
3. **Read** `CLAUDE.md` — project conventions
3b. **Read** `brand-guidelines.md` — colors, typography, component styling (Red/Black/White palette)
4. **Execute** the current round's tasks
5. **Run E2E tests**: `cd e2e && npx playwright test`
6. **Update** `.ralph/progress.txt` with what you completed, commit hash, and next task
7. **Commit**: `git add -A && git commit -m "feat(skjold): <description>"`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Backend | Hono (REST API on port 3000) |
| Database | SQLite via `bun:sqlite` |
| Frontend | React + Vite (port 5173) + TailwindCSS + shadcn/ui |
| Charts | Recharts |
| E2E Tests | Playwright |
| Language | TypeScript, all UI in Danish |

## Project Structure

```
backend/src/
  index.ts          — Hono app + Bun.serve()
  db/schema.ts      — CREATE TABLE statements
  db/migrate.ts     — Run migrations on startup
  db/seed.ts        — Dev seed data
  routes/           — auth, players, fines, matches, teams, sync, stats, admin
  services/         — spond, dbu, fines, team-generator
  middleware/auth.ts — Session cookie auth
  lib/db.ts         — SQLite singleton
  lib/types.ts      — Shared types

frontend/src/
  main.tsx, App.tsx  — Entry + React Router
  components/ui/     — shadcn/ui
  components/layout/ — Sidebar, header
  pages/             — login, dashboard, fines/, teams/, history/, tournament/, analysis/, admin/
  hooks/             — use-api, use-auth
  lib/api.ts         — Typed API client
  i18n/da.ts         — Danish strings

e2e/
  playwright.config.ts
  fixtures/          — auth.fixture.ts, test-data.ts, pages/
  specs/             — auth/, dashboard/, fines/, teams/, history/, tournament/, analysis/, admin/, integration/
```

## Design Rules

1. **API-first**: Backend serves REST API, frontend consumes it. No SSR.
2. **Auth**: Simple env-based credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD` in `.env`), session cookie.
3. **Database**: SQLite via `bun:sqlite`. Schema in `backend/src/db/schema.ts`. Migrations run on startup.
4. **E2E tests gate every round**: Do not move to the next round until E2E tests pass for the current round.
5. **Page Objects**: All E2E tests use page objects with `data-testid` locators. No raw CSS selectors in specs.
6. **data-testid naming**: `{domain}-{element}[-{qualifier}]` (e.g., `fine-overview-table`, `team-generate-button`)
7. **Danish UI**: All user-facing text in Danish. Strings centralized in `frontend/src/i18n/da.ts`.
8. **One round per iteration**: Complete one round, commit, update progress, exit. The next iteration will pick up from there.
9. **Seed data for tests**: E2E tests should work with seeded data. Create seed scripts that populate the database with deterministic test data.
10. **No git auto-backup**: SQLite is the sole data store. No auto-commit to GitHub.

## Completion Criteria

When ALL 10 rounds are complete and ALL E2E tests pass, output:

```
<promise>SKJOLD_BODE_REBUILD_COMPLETE</promise>
```

Do NOT output the promise if any round is incomplete or any test is failing.
