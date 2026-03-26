# Skjold Bode Brugerregistrering & Rollesystem — PRD

## Goal

Byg et brugerregistrerings- og rollesystem til BK Skjold appen. Tre roller: Admin (fuld adgang), Spiller (kan se alt men ikke oprette/redigere), Fan (begrænset adgang). Inkluderer registreringsside, admin-godkendelse af spillere, og rolle-baseret UI.

## Feature Overview

### Roller
| Rolle | Adgang | Godkendelse |
|-------|--------|-------------|
| **Admin** | Alt | Env-bootstrap eller manuelt |
| **Spiller** | Se alt, men kan IKKE oprette hold, tildele bøder, eller tilgå admin | Kræver admin-godkendelse |
| **Fan** | Dashboard, Turnering, Kampanalyse | Auto-godkendt |

### Registrering
- Tilmeldingsformular med navn, email, password, rolle-valg (Fan/Spiller)
- Spillere kan angive Spond email for at koble til eksisterende spiller-profil
- Fans godkendes automatisk, spillere afventer admin-godkendelse
- "Tilmeld dig"-knap på både landing-side og login-side

### Admin Brugerhåndtering
- Admin ser ventende tilmeldinger i admin-panelet
- Godkend eller afvis spillere
- Fuld brugerliste med roller og status

### UI Ændringer
- Dashboard overskrift komprimeret (mere plads til indhold)
- Sidebar filtreret efter rolle
- Handlingsknapper skjult for ikke-admins
- Rolle-badge i header

---

## Rounds

### Round 1: Database + Registrerings-API

**Backend changes:**

- [ ] Add `users` table to `backend/src/db/schema.ts`:
  ```sql
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','spiller','fan')) DEFAULT 'fan',
    player_id TEXT REFERENCES players(id),
    approved INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  ```
- [ ] Admin bootstrap in `backend/src/db/migrate.ts`: If no admin user in DB, create one from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars with role=admin, approved=1
- [ ] Extend session type in `backend/src/middleware/auth.ts`:
  ```typescript
  { email: string; role: 'admin' | 'spiller' | 'fan'; userId: string; createdAt: number }
  ```
- [ ] Update `createSession()` to accept role and userId
- [ ] Create `requireRole(...roles)` middleware factory
- [ ] `POST /api/auth/register` (public):
  - Accepts `{ name, email, password, role, spondEmail? }`
  - Uses `Bun.password.hash(password, "bcrypt")` for hashing
  - Fan: set approved=1 (auto-approved)
  - Spiller: set approved=0 (pending). If spondEmail provided, lookup player by matching in players table, set player_id
  - Reject duplicate emails
  - Password min 6 characters
- [ ] Refactor `POST /api/auth/login`:
  - First check DB users with `Bun.password.verify()`
  - Reject if approved=0 with message "Afventer godkendelse"
  - Fallback: check env-based ADMIN_EMAIL/ADMIN_PASSWORD (backward compat)
  - Create session with role and userId
- [ ] Update `GET /api/auth/me` to return `{ email, name, role, playerId }`
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): user registration backend with roles, password hashing, admin bootstrap`

### Round 2: Admin Bruger-API + Rute-beskyttelse

**Backend changes:**

- [ ] `GET /api/admin/users` (admin only) — list all users with player display_name if linked
- [ ] `GET /api/admin/users/pending` (admin only) — list unapproved spiller users
- [ ] `PATCH /api/admin/users/:id/approve` (admin only) — set approved=1
- [ ] `DELETE /api/admin/users/:id` (admin only) — remove user
- [ ] Apply role-based route protection:
  - **Admin-only** (write operations):
    - `POST /api/fines`, `PATCH /api/fines/:id/pay`, `DELETE /api/fines/:id`
    - All `/api/fines/types/*` mutations (POST, PUT, DELETE)
    - `POST /api/teams/generate`, `POST /api/teams/swap`
    - `POST /api/matches`, `PATCH /api/matches/:id/result`, `DELETE /api/matches/:id`
    - `POST /api/sync/*`
    - All `/api/admin/*`
    - `POST /api/formations`, `PUT /api/formations/:id`, `DELETE /api/formations/:id`
  - **Admin + Spiller** (read operations):
    - `GET /api/fines/*`, `GET /api/players/*`, `GET /api/matches/*`
    - `GET /api/teams/*`, `GET /api/formations/*`, `GET /api/analysis/*`
  - **All authenticated** (admin + spiller + fan):
    - `GET /api/stats/dashboard`, `GET /api/tournament/*`, `GET /api/auth/me`
- [ ] Unapproved users return 401 on any protected route
- [ ] Run E2E tests — all pass (E2E uses env-based admin login)
- [ ] Commit: `feat(skjold): admin user management API and role-based route protection`

### Round 3: Frontend — Registrering, Auth-hook, UI-tweaks

**Frontend changes:**

- [ ] Add i18n strings to `frontend/src/i18n/da.ts`:
  - register.title, register.name, register.email, register.password
  - register.role, register.fan, register.player, register.spondEmail
  - register.spondHint, register.submit, register.loginLink
  - register.success, register.pendingApproval, register.fanReady
  - login.registerLink
- [ ] Create `frontend/src/pages/register.tsx`:
  - Name, email, password fields
  - Role selector: radio/tabs for "Fan" / "Spiller"
  - Spond email field (visible only when "Spiller" selected)
  - On submit: call `POST /api/auth/register`
  - Fan success → show "Du kan nu logge ind" + link to login
  - Spiller success → show "Afventer godkendelse fra administrator"
  - Error handling: duplicate email, validation errors
  - data-testid on all elements
- [ ] Update `frontend/src/hooks/use-auth.ts`:
  - Add `role` and `name` to AuthState
  - Parse from `/api/auth/me` response
- [ ] Update `frontend/src/App.tsx`:
  - Add `/register` route (public, like `/login`)
- [ ] Update `frontend/src/pages/login.tsx`:
  - Add "Har du ikke en konto? Tilmeld dig" link to `/register`
- [ ] Update landing page (in `App.tsx` or dedicated landing):
  - Add "Tilmeld dig" button linking to `/register`
- [ ] Update `frontend/src/pages/dashboard.tsx`:
  - Compress heading: remove logo from header area, reduce spacing
  - Keep sync button and title, just more compact
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): registration page, auth role support, signup buttons on landing/login`

### Round 4: Frontend — Rolle-baseret UI + Admin Godkendelsespanel

**Frontend changes:**

- [ ] Update `frontend/src/components/layout/sidebar.tsx`:
  - Accept `role` from useAuth or prop
  - Filter navItems by role:
    - Fan: Oversigt (Dashboard), Turnering, Kampanalyse
    - Spiller: all except Admin
    - Admin: all
- [ ] Update `frontend/src/App.tsx` (ProtectedLayout):
  - Route guards: redirect fan from /fines, /teams, /history, /admin to /dashboard
- [ ] Update fines pages:
  - Hide "Tilføj bøde" button, pay/delete actions for non-admin
- [ ] Update teams page:
  - Hide "Generer hold" button for non-admin
- [ ] Update `frontend/src/pages/admin/settings.tsx`:
  - Add "Brugere" tab with Users icon
  - Pending approval section at top with approve/reject buttons
  - Full user list with role badges
  - Each pending row: name, email, linked player, created date, approve/reject
- [ ] Update `frontend/src/components/layout/header.tsx`:
  - Show role badge next to email
- [ ] Add i18n strings:
  - admin.tabs.users, admin.users.title, admin.users.pending
  - admin.users.approve, admin.users.reject, admin.users.noPending
  - roles.admin, roles.spiller, roles.fan
- [ ] data-testid on all new elements
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): role-based sidebar, action gating, admin user approval panel`

### Round 5: Polish, Edge Cases & E2E Tests

**Testing & polish:**

- [ ] E2E test: `e2e/specs/auth/register.spec.ts`:
  - Fan registration → login → see limited sidebar
  - Spiller registration → pending message → cannot login
  - Duplicate email error
- [ ] E2E test: `e2e/specs/auth/roles.spec.ts`:
  - Fan cannot access fines page (redirect)
  - Spiller can view but not create fines
  - Admin has full access
- [ ] E2E test: `e2e/specs/admin/users.spec.ts`:
  - Admin sees pending users
  - Admin approves user → user can login
- [ ] Password min-length validation on frontend and backend
- [ ] Session invalidation: if admin deletes a user with active session, next request returns 401
- [ ] Registration page responsive on mobile
- [ ] Admin users tab responsive on mobile
- [ ] Env-based admin backward compatibility confirmed
- [ ] Run ALL E2E tests (existing + new) — all pass
- [ ] Commit: `feat(skjold): registration & roles polish, E2E tests, edge cases`

---

## Technical Notes

### Password Hashing (Bun built-in)
```typescript
const hash = await Bun.password.hash(password, "bcrypt");
const valid = await Bun.password.verify(password, hash);
```

### Database: PostgreSQL via Bun.SQL
The project uses `Bun.SQL` with PostgreSQL (NOT SQLite). All queries use tagged template literals:
```typescript
import { sql } from "../lib/db";

// Parameterized queries (preferred)
const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
await sql`INSERT INTO users (id, name, email, password_hash, role, approved) VALUES (${id}, ${name}, ${email}, ${hash}, ${role}, ${approved})`;

// Dynamic SQL (when query structure varies)
const rows = await sql.unsafe("SELECT * FROM users WHERE role = $1", [role]);
```

### Session Type
```typescript
// Before
const sessions = new Map<string, { email: string; createdAt: number }>();

// After
const sessions = new Map<string, {
  email: string;
  role: 'admin' | 'spiller' | 'fan';
  userId: string;
  createdAt: number
}>();
```

### Role Middleware
```typescript
export function requireRole(...roles: string[]) {
  return createMiddleware(async (c, next) => {
    const session = c.get("session");
    if (!session || !roles.includes(session.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  });
}
```

### Spond Player Matching
The `players` table has `display_name` and could match on email if Spond stores it. Pragmatic approach: store the claimed Spond email on the user record, attempt auto-match by looking up players. If no match found, `player_id` stays null — admin can see this during approval and manually link if needed.

### Env-Admin Fallback
The env-based admin login (ADMIN_EMAIL/ADMIN_PASSWORD) is preserved as a fallback. This ensures existing deployments continue to work. On first startup with the new schema, an admin user is auto-created in the DB from these env vars.

## Success Criteria

1. Three distinct roles with correct access levels
2. Registration flow works for both fans and players
3. Admin can approve/reject player registrations
4. Sidebar and action buttons respect user role
5. Existing admin login still works (backward compat)
6. Spond email matching links players to user accounts
7. All existing + new E2E tests pass
8. All UI text in Danish
