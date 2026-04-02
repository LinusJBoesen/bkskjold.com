# [PROJECT NAME] — Ralph Loop Prompt

## Context

[Brief context about the project and what this loop is doing]

**IMPORTANT**: Do NOT invoke any skills or slash commands. Just read the files, do the work directly, and commit. You are running headless via `claude -p --dangerously-skip-permissions`.

## Startup Sequence (Every Iteration)

1. **Read** `.ralph/progress.txt` — find your current round
2. **Read** `.ralph/PRD.md` — find acceptance criteria for the current round
3. **Read** `CLAUDE.md` — understand project conventions
4. **Execute** the current round's tasks
5. **Run E2E tests**: `cd e2e && npx playwright test`
6. **Update** `.ralph/progress.txt` with what you completed
7. **Update** `.ralph/CHANGELOG.md` — append a summary line for this round
8. **Commit**: `git add -A && git commit -m "feat(skjold): <description>"`
9. **EXIT** — stop after completing ONE round. The loop runner will restart you with fresh context for the next round.

## Design Direction

Follow the existing dark theme (zinc-950 backgrounds, zinc-900/50 cards, red accent #D42428). All new UI should match existing page styling. Use shadcn/ui components where available.

## Critical Rules

- **Do NOT break E2E tests.** All existing `data-testid` attributes must remain unchanged.
- **One round per iteration.** Complete one round, commit, update progress, then EXIT immediately.
- **Keep all existing functionality.** Nothing should regress.
- **All UI text in Danish** — use `frontend/src/i18n/da.ts` for new strings.
- **Fresh context**: You will be restarted after each round. All state is in files — read progress.txt to know where you are.

## Completion Criteria

When ALL rounds are complete and ALL E2E tests pass, output:

```
<promise>[COMPLETION_PROMISE]</promise>
```

Do NOT output the promise until every round is genuinely done.
