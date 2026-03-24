# Skjold Bode UI Overhaul — Ralph Loop Prompt

## Context

You are overhauling the UI of the BK Skjold football team management app to a modern dark theme inspired by openclaw.ai. The app is fully functional. You are ONLY changing frontend code. Do NOT modify backend code except to add missing features specified in the PRD.

**IMPORTANT**: Do NOT invoke any skills or slash commands. Just read the files, do the work directly, and commit. You are running headless via `claude -p`.

## Startup Sequence (Every Iteration)

1. **Read** `.ralph/progress.txt` — find your current round
2. **Read** `.ralph/PRD.md` — find design direction and acceptance criteria
3. **Execute** the current round's tasks
4. **Run E2E tests**: `cd e2e && npx playwright test`
5. **Update** `.ralph/progress.txt` with what you completed
6. **Commit**: `git add -A && git commit -m "feat(skjold): <description>"`

## Design Direction: Dark Theme (openclaw.ai-inspired)

- **Dark backgrounds**: `bg-zinc-950` page, `bg-zinc-900/50` cards
- **Subtle borders**: `border-zinc-800` or `border-white/5`
- **White text**: `text-zinc-50` primary, `text-zinc-400` secondary
- **Red accent**: `#D42428` for CTAs and active states only
- **Status badges**: Semi-transparent colored backgrounds (`bg-emerald-500/10 text-emerald-400`)
- **Smooth transitions**: `transition-all duration-200` everywhere
- **Dark inputs**: `bg-zinc-800 border-zinc-700` with red focus ring
- **Tables**: `bg-zinc-900` headers, subtle `border-zinc-800/50` rows
- **Lucide icons**: For all navigation and action buttons

## Critical Rules

- **Do NOT break E2E tests.** All `data-testid` attributes must remain unchanged.
- **Do NOT modify backend code** unless adding the clipboard copy or profile picture features.
- **One round per iteration.** Complete one round, commit, update progress, exit.
- **Keep all existing functionality.** This is a visual overhaul, not a rewrite.
- **Dark mode everywhere.** No light backgrounds should remain after completion.

## Completion Criteria

When ALL 6 rounds are complete and ALL E2E tests pass, output:

```
<promise>SKJOLD_BODE_UI_COMPLETE</promise>
```
