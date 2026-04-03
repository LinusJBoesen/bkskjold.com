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

## Design Philosophy — IMPORTANT

- **No duplicate KPIs**: A data point or metric must NOT appear more than once on the same page. If win rate is shown in a chart, it should not also appear in a card and a table on the same page. Audit each page and remove duplicates.
- **Simplicity over quantity**: The dashboard should be simple, clean, and meaningful. Fewer widgets done well beats many widgets competing for attention. Every element must earn its place — if it doesn't provide unique, actionable insight, remove it.
- **Refine before adding**: Priority is to make existing elements better (clearer labels, better chart types, smarter layout, better mobile UX) rather than adding new features. Only add something new if there's a clear gap.
- **Each page has a clear purpose**: Dashboard = high-level overview at a glance. Træningshistorik = deep dive into training performance. Kampanalyse = deep dive into competitive match data. Don't let pages overlap in what they show.

## PRIORITY: Hold Udvælger (Team Selector) Overhaul

After finishing the current iteration, the NEXT focus is making the Hold Udvælger page world-class. Spend multiple iterations on this. Key requirements:

### Mobile UX
- Make it easy to move players around on mobile — drag-and-drop or tap-to-move, large touch targets
- The page must work beautifully on phone screens

### Smart Auto-Placement
- Auto-place players into positions based on their assigned position (from `player_positions` table)
- Balance teams automatically using position data — don't put all defenders on one team

### Two Modes — Kamp vs Træning
- **Kamp (match)**: Only setting up OUR team (one team). Includes a bench. Players placed on pitch + bench.
- **Træning (training)**: Two teams, no bench. Split players evenly into balanced teams.
- The mode should be clearly selectable and change the UI accordingly.

### General
- Make it top-class, intuitive, visually appealing
- Read the current `frontend/src/pages/teams/selector.tsx` and `backend/src/routes/teams.ts` to understand existing functionality before making changes

## Continuous Improvement Mode

After Hold Udvælger is done, enter review-and-improve mode. Each iteration: first **read `.ralph/CHANGELOG.md`** to see all previous decisions and improvements (this is your memory across context resets — do not repeat or undo previous work). Then:

1. **Audit** each page for duplicate KPIs, redundant sections, and clutter
2. **Simplify** — remove or consolidate anything that doesn't add unique value
3. **Refine** — improve what's there (layout, responsiveness, clarity) before adding anything new
4. Pick the single most impactful improvement, implement it, commit, exit.

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

### Failed Attempts & Dead Ends
- [Anything you tried that didn't work, and why — so future iterations don't repeat it]
- [E.g. "Tried radar chart for player comparison but Recharts radar doesn't support dark theme tooltips well"]

### Next Iteration Ideas
- [Only list NEW ideas not already mentioned in previous changelog entries]
- [If a previous iteration already suggested something and it wasn't done, don't repeat it — it's already in the changelog for future reference]
- [Focus on ideas that came from THIS iteration's review, not carried over]
```

This is critical — the user reviews the changelog while the loop runs to stay informed. Be specific, not vague. "Added a chart" is bad. "Added a donut chart for fine breakdown by type using the existing `fineByType` data from `/api/stats/dashboard`, chose donut over bar chart because it better shows proportional distribution" is good.

## Completion

There is NO completion promise. This loop runs forever. Keep improving until manually killed.
