# Skjold Bode — BK Skjold Football Team Management

A web app for BK Skjold football team: fine management, data tracking, team generation, tournament standings, match analysis, formations, fan signup, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Backend | Hono REST API (port 3000), Postgres via `Bun.SQL` |
| Frontend | React 19 + Vite (port 5173) + TailwindCSS v4 + shadcn/ui |
| Charts | Recharts |
| E2E Tests | Playwright |
| Language | TypeScript, all UI in Danish |

## Development

```bash
# Start both servers (backend + frontend) via concurrently
bun run dev

# Start individually
bun run dev:backend
bun run dev:frontend

# Run E2E tests
cd e2e && npx playwright test

# Run specific test file
cd e2e && npx playwright test specs/integration/full-flow.spec.ts
```

`DATABASE_URL` is read from `.env` (defaults to `postgres://localhost:5432/skjold`).

## Project Structure

```
backend/src/
  index.ts            — Hono app + Bun.serve() on port 3000
  db/schema.ts        — CREATE TABLE statements
  db/migrate.ts       — Run migrations on startup
  db/seed.ts          — Dev seed data (players, fines, matches, config, DBU)
  routes/             — auth, players, fines, matches, teams, sync, stats,
                         tournament, analysis, admin, formations, fan-signup,
                         bodekasse, dbu
  services/           — spond (API client), dbu (scraper), dbu-name-map,
                         match-details (+ test), fines, team-generator
  middleware/auth.ts   — Session cookie auth + requireRole role guard
  lib/db.ts           — Postgres connection (Bun.SQL)

frontend/src/
  main.tsx, App.tsx    — Entry + React Router with protected routes + RoleGuard
  components/ui/       — shadcn/ui (badge, button, card, input, table)
  components/layout/   — Sidebar (responsive), Header (hamburger menu)
  components/pitch/    — Formation rendering: Pitch, FormationView,
                         FormationSelector, FormationSlot, PlayerCard,
                         PlayerPanel, BenchArea
  components/toast.tsx — Toast notification system (context-based)
  pages/               — landing, login, register, dashboard,
                         fines/{overview,detail}, teams/selector,
                         history/training, matches/detail,
                         tournament/standings, analysis/match,
                         admin/settings, fan/seasoncard
  hooks/use-auth.ts    — Auth state management
  lib/api.ts           — Typed API client with credentials
  i18n/da.ts           — Danish strings

e2e/
  playwright.config.ts — Config with webServer for both backend + frontend
  fixtures/            — auth.fixture.ts, test-data.ts, pages/*.page.ts
  specs/               — auth/, dashboard/, fines/, teams/, history/,
                         tournament/, analysis/, admin/, integration/,
                         health/, layout/, sync/, formations/, matches/
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (public) |
| POST | `/api/auth/register` | Register new user (pending admin approval) |
| POST | `/api/auth/login` | Login |
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
| GET | `/api/matches/:id` | Match by id |
| GET | `/api/matches/:id/details` | Detailed match view |
| GET | `/api/matches/:id/events` | Match event timeline |
| POST | `/api/matches/:id/events` | Add match event |
| POST | `/api/matches` | Create match |
| PATCH | `/api/matches/:id/result` | Register result + auto-fines |
| PATCH | `/api/matches/:id/complete` | Mark match complete |
| DELETE | `/api/matches/:id` | Delete match |
| GET | `/api/matches/stats/all` | Player statistics |
| GET | `/api/matches/export/csv` | CSV export |
| POST | `/api/teams/generate` | Generate balanced teams |
| POST | `/api/teams/swap` | Swap player between teams |
| GET | `/api/teams/available` | Available players with stats |
| GET | `/api/stats/dashboard` | Dashboard aggregation |
| GET | `/api/tournament/standings` | DBU standings |
| GET | `/api/analysis/player-rates` | Match analysis data |
| GET | `/api/formations/slots` | Formation slot definitions |
| GET/PUT | `/api/formations/players/:id/positions` | Player position prefs |
| GET | `/api/formations/players/positions` | All player positions |
| GET | `/api/formations/latest/:teamNumber` | Latest formation per team |
| GET | `/api/formations/:matchId/:teamNumber` | Formation by match+team |
| POST/PUT/DELETE | `/api/formations[/:id]` | Formation CRUD |
| POST | `/api/fan-signup` | Public fan signup |
| GET | `/api/fan-signup` | List signups (admin) |
| DELETE | `/api/fan-signup/:id` | Remove signup (admin) |
| GET/POST/DELETE | `/api/bodekasse[/:id]` | Bødekasse entries |
| GET | `/api/dbu/teams/:teamId/matches` | DBU match list for a team |
| GET | `/api/dbu/matches/:dbuMatchId/info` | DBU match info |
| POST | `/api/dbu/matches/:dbuMatchId/info/refresh` | Refresh DBU match info |
| GET/PUT | `/api/admin/config[/:key]` | Config management |
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/users/pending` | List users awaiting approval |
| PATCH | `/api/admin/users/:id/approve` | Approve pending user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/export` | Full DB export as JSON |
| POST | `/api/admin/import` | Import JSON data |

## Auth

Session-cookie auth with three roles: `admin`, `spiller` (player), `fan`. Users self-register via `/api/auth/register` and start in a pending state until an admin approves them through `/api/admin/users/:id/approve`. Sessions are stored in-memory keyed by a UUID cookie. Backend routes use `requireRole(...roles)` to gate access; the frontend uses `<RoleGuard allowed={[...]}>` to gate pages. All `/api/*` routes are protected except `/api/health`, `/api/auth/login`, `/api/auth/register`, and `/api/fan-signup` (POST).

## Production Deployment

Live at https://bkskjold.com on a self-hosted Hetzner Cloud VPS.

| Detail | Value |
|--------|-------|
| Provider | Hetzner Cloud, CX22 (x86, 2 vCPU, 4 GB RAM, 40 GB), Helsinki (HEL1) |
| OS | Ubuntu 24.04 LTS |
| Public IP | 157.180.71.6 |
| Domain | `bkskjold.com`, `www.bkskjold.com` (Cloudflare DNS only — proxy off) |
| TLS | Caddy + Let's Encrypt (auto-renew) |
| Runtime | Bun (`/opt/bun/bin/bun`) |
| Database | PostgreSQL 18 on `localhost:5432`, db `skjold`, user `skjold` (password in `/root/.skjold-secrets`) |
| App location | `/opt/skjold` (cloned from this repo, owned by `skjold` user) |
| Service | systemd `skjold.service` running as `skjold` user, env from `/opt/skjold/backend/.env` |
| Reverse proxy | Caddy → `localhost:3000`, config at `/etc/caddy/Caddyfile` |
| Backups | `/usr/local/bin/skjold-backup.sh` daily 04:00 UTC → `/var/backups/skjold/` (14-day retention) |
| Hardening | `unattended-upgrades`, `fail2ban`, `PasswordAuthentication no`, key-only root SSH |

### SSH access

```bash
ssh root@157.180.71.6
```

The user's ed25519 key (`~/.ssh/id_ed25519`) is the only authorized key on the box. The key is loaded into the macOS Keychain via `ssh-add --apple-use-keychain ~/.ssh/id_ed25519`, so commands invoked from this repo (including by Claude through the Bash tool) can SSH in non-interactively without re-prompting for the passphrase. If SSH starts asking for a passphrase again, re-run the `ssh-add` command above.

### Common ops

```bash
# Tail app logs
ssh root@157.180.71.6 'journalctl -u skjold -f'

# Restart app / Caddy
ssh root@157.180.71.6 'systemctl restart skjold'
ssh root@157.180.71.6 'systemctl reload caddy'

# psql into prod DB
ssh root@157.180.71.6 'sudo -u postgres psql skjold'

# Caddy config + recent logs
ssh root@157.180.71.6 'cat /etc/caddy/Caddyfile; journalctl -u caddy -n 50 --no-pager'

# Manual backup (also runs daily via cron)
ssh root@157.180.71.6 '/usr/local/bin/skjold-backup.sh'
ssh root@157.180.71.6 'ls -la /var/backups/skjold/'
```

### Manual deploy (until CI is wired)

```bash
ssh root@157.180.71.6 'set -e
  cd /opt/skjold
  git pull
  cd frontend && bunx vite build && cd ..
  rm -rf backend/static && mv frontend/dist backend/static
  chown -R skjold:skjold /opt/skjold
  systemctl restart skjold'
```

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
- `CHANGELOG.md` — round-by-round history
