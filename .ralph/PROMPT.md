# Skjold Bode GitHub Issues Batch — Ralph Loop Prompt

## Context

You are fixing and implementing features from GitHub issues for the BK Skjold 7-a-side team management app. The issues cover UI fixes, match data improvements, training match management, kampanalyse, turnering, and fan signup. The app already has a working user registration and role system (admin/spiller/fan).

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

Follow the existing dark theme (zinc-950 backgrounds, zinc-900/50 cards, red accent #D42428). All new UI should match existing page styling. Use shadcn/ui components where available.

### Key Technical Decisions
- **Database**: SQLite via `bun:sqlite`. Use the existing `db` singleton from `backend/src/lib/db.ts`.
- **Auth**: Session cookie auth with role-based access (admin/spiller/fan). Use `requireRole()` middleware for protected routes.
- **API pattern**: Follow existing Hono route patterns in `backend/src/routes/`.
- **Frontend**: React 19 + Vite + TailwindCSS v4 + shadcn/ui. Use existing component library.

## Critical Rules

- **Do NOT break E2E tests.** All existing `data-testid` attributes must remain unchanged.
- **One round per iteration.** Complete one round, commit, update progress, exit.
- **Keep all existing functionality.** Nothing should regress.
- **Dark theme everywhere.** Match the existing app aesthetic.
- **All UI text in Danish** — use `frontend/src/i18n/da.ts` for new strings.
- **Use `data-testid`** on all new interactive elements for future E2E testing.
- **Respect roles**: Admin for write operations, spiller for read, fan for limited access.

## Completion Criteria

When ALL rounds are complete and ALL E2E tests pass, output:

```
<promise>SKJOLD_ISSUES_COMPLETE</promise>
```
