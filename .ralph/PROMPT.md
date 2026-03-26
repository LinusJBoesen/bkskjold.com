# Skjold Bode Brugerregistrering & Rollesystem — Ralph Loop Prompt

## Context

You are building a user registration and role-based access control system for the BK Skjold 7-a-side team management app. The app currently has a single admin user authenticated via environment variables. This feature adds multi-user support with three roles: Admin (full access), Spiller/Player (read-only with Spond linking), and Fan (limited access to public data).

**IMPORTANT**: Do NOT invoke any skills or slash commands. Just read the files, do the work directly, and commit. You are running headless via `claude -p`.

## Startup Sequence (Every Iteration)

1. **Read** `.ralph/progress.txt` — find your current round
2. **Read** `.ralph/PRD.md` — find acceptance criteria for the current round
3. **Read** `CLAUDE.md` — understand project conventions
4. **Execute** the current round's tasks
5. **Run E2E tests**: `cd e2e && npx playwright test`
6. **Update** `.ralph/progress.txt` with what you completed
7. **Commit**: `git add -A && git commit -m "feat(skjold): <description>"`

## Design Direction

Follow the existing dark theme (zinc-950 backgrounds, zinc-900/50 cards, red accent #D42428). Registration page should match the login page styling. Admin users tab should match existing admin settings layout.

### Key Technical Decisions
- **Database**: PostgreSQL via `Bun.SQL` (NOT SQLite). Use `sql` tagged template literals for queries, `sql.unsafe()` for dynamic SQL. Timestamps use `TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
- **Password hashing**: `Bun.password.hash(password, "bcrypt")` — built-in, no external dependency
- **Env-admin fallback**: Keep ADMIN_EMAIL/ADMIN_PASSWORD as bootstrap + fallback. Auto-create admin in DB on first startup.
- **Session enrichment**: Store `{ email, role, userId, createdAt }` in session map
- **Spond matching**: Player provides Spond email at registration, backend looks up matching player record
- **Role middleware**: `requireRole(...roles)` factory function for route protection

## Critical Rules

- **Do NOT break E2E tests.** All existing `data-testid` attributes must remain unchanged.
- **One round per iteration.** Complete one round, commit, update progress, exit.
- **Keep all existing functionality.** The current admin login via env vars must still work.
- **Dark theme everywhere.** Match the existing app aesthetic.
- **All UI text in Danish** — use `frontend/src/i18n/da.ts` for new strings.
- **Use `data-testid`** on all new interactive elements for future E2E testing.

## Completion Criteria

When ALL rounds are complete and ALL E2E tests pass, output:

```
<promise>SKJOLD_USERS_COMPLETE</promise>
```
