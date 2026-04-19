# Skjold Bode — Match Details Ralph Loop

## Context

Adding rich match detail views to the BK Skjold team management app. Every DBU match in the app should be clickable and open a detail page showing practical info (location, kickoff time from Spond), comparative info (head-to-head, opponent season, common opponents — scraped from DBU's `/kampprogram`), and kampfakta (referee, lineups, goal scorers — scraped from DBU's `/kampinfo`). See `.ralph/PRD.md` for the 7-round breakdown.

**IMPORTANT**: Do NOT invoke any skills or slash commands. Just read the files, do the work directly, and commit. You are running headless via `claude -p --dangerously-skip-permissions`.

## Startup Sequence (Every Iteration)

1. **Read** `.ralph/progress.txt` — find your current round
2. **Read** `.ralph/PRD.md` — find acceptance criteria for the current round
3. **Read** `CLAUDE.md` — understand project conventions
4. **Execute** the current round's tasks — write/edit code to satisfy every checkbox
5. **Run E2E tests**: `cd e2e && npx playwright test`
6. **Update** `.ralph/progress.txt` with what you completed (tick checkboxes, bump round, add commit row)
7. **Update** `.ralph/CHANGELOG.md` — append a row for this iteration
8. **Commit**: `git add -A && git commit -m "feat(skjold): <description>"`
9. **EXIT** — stop after completing ONE round. The loop runner will restart you with fresh context for the next round.

## Design Direction

- Dark theme: zinc-950 backgrounds, zinc-900/50 cards, red accent #D42428
- shadcn/ui components where available (`components/ui/`)
- Match the visual density of existing pages — don't over-design
- Mobile-first; sections should stack below `lg` breakpoint
- Recharts only where a chart genuinely adds clarity over a table

## Critical Rules

- **Do NOT break E2E tests.** All existing `data-testid` attributes must remain unchanged
- **One round per iteration.** Complete one round, commit, update progress, then EXIT immediately
- **Keep all existing functionality.** Dashboard, fines, teams, training history, analysis, tournament, admin must not regress
- **All UI text in Danish** — add new strings to `frontend/src/i18n/da.ts`
- **Training matches are out of scope** — this loop only touches DBU/external opponent matches. Do not modify the internal `matches` table semantics or the team-selector/training-history flows
- **Fresh context**: You will be restarted after each round. All state is in files — read `progress.txt` to know where you are
- **Scraper politeness**: keep the 1-hour in-memory cache pattern when adding new DBU scrapers; never hammer the DBU site

## Completion Criteria

When ALL 7 rounds are complete AND all E2E tests pass (including the new match-detail spec), output:

```
<promise>MATCH_DETAILS_SHIPPED</promise>
```

Do NOT output the promise until every round is genuinely done and committed.
