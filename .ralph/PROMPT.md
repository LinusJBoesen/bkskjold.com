# Dashboard & Stats Upgrade — Ralph Loop Prompt

## Context

You are upgrading the Dashboard, Træningshistorik, and Kampanalyse pages for BK Skjold's team management app. The goal is more charts, smarter data usage, better UI, and modern responsive design. This is an infinite loop — there is no completion promise. You keep improving until manually stopped.

**IMPORTANT**: Do NOT invoke any skills or slash commands. Just read the files, do the work directly, and commit. You are running headless via `claude -p --dangerously-skip-permissions`.

## Startup Sequence (Every Iteration)

1. **Read** `.ralph/progress.txt` — find your current round and what's been done
2. **Read** `.ralph/PRD.md` — find acceptance criteria for the current round
3. **Read** `CLAUDE.md` — understand project conventions
4. **Execute** the current round's tasks
5. **Run E2E tests**: `cd e2e && npx playwright test`
6. **Update** `.ralph/progress.txt` with what you completed
7. **Update** `.ralph/CHANGELOG.md` — document every decision and change made this iteration (see Changelog Rules below)
8. **Commit**: `git add -A && git commit -m "feat(skjold): <description>"`
9. **EXIT** — stop after completing ONE round. The loop runner will restart you with fresh context for the next round.

## Design Direction

Follow the existing dark theme (zinc-950 backgrounds, zinc-900/50 cards, red accent #D42428). All new UI should match existing page styling. Use shadcn/ui components and Recharts for charts.

## Critical Rules

- **Do NOT break E2E tests.** All existing `data-testid` attributes must remain unchanged.
- **One round per iteration.** Complete one round, commit, update progress, then EXIT immediately.
- **Keep all existing functionality.** Nothing should regress.
- **All UI text in Danish** — use `frontend/src/i18n/da.ts` for new strings.
- **Fresh context**: You will be restarted after each round. All state is in files — read progress.txt to know where you are.
- **After Round 5**: Enter continuous improvement mode. Each iteration: review all pages, pick the single most impactful improvement, implement it, commit, exit. Focus on: unused data, better chart types, mobile UX, smarter statistical insights, modern UI patterns.

## Changelog Rules

The changelog (`.ralph/CHANGELOG.md`) is how the user tracks your work in real time. For EVERY iteration, append a detailed entry using this format:

```
## Iteration N — Round X: [Title]
**Date**: YYYY-MM-DD HH:MM

### Changes
- [What you changed, file by file]

### Decisions & Reasoning
- **Decision**: [What you chose to do]
  **Why**: [Why you chose this approach over alternatives]
- **Decision**: [Another choice you made]
  **Why**: [Reasoning]

### Data Usage
- [What data sources you used and how]
- [Any unused data you noticed for future iterations]

### Next Iteration Ideas
- [What you'd improve next if you continue]
```

This is critical — the user reviews the changelog while the loop runs to stay informed. Be specific, not vague. "Added a chart" is bad. "Added a donut chart for fine breakdown by type using the existing `fineByType` data from `/api/stats/dashboard`, chose donut over bar chart because it better shows proportional distribution" is good.

## Completion

There is NO completion promise. This loop runs forever. Keep improving until manually killed.
