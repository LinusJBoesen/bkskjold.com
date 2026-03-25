# Skjold Bode Formation Builder — Ralph Loop Prompt

## Context

You are building a Football Manager-style formation and lineup builder for the BK Skjold 7-a-side team management app. This feature lets coaches visually arrange players on a pitch with drag-and-drop, assign positions, and manage lineups for training matches.

The app already has a team selector that generates balanced teams. This feature replaces the simple team list view with a visual pitch formation view — like FIFA or Football Manager.

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

Follow the existing dark theme (zinc-950 backgrounds, zinc-900/50 cards, red accent #D42428). The pitch should feel like a Football Manager tactics screen — dark green pitch with player cards positioned in formation slots.

### Pitch Styling
- **Pitch background**: Dark green gradient (`from-emerald-950 to-emerald-900`) with subtle field lines
- **Player cards on pitch**: Dark cards with player name, position badge, and profile picture
- **Empty slots**: Dashed border placeholder showing position name
- **Bench area**: Below the pitch, dark card row for substitutes
- **Drag feedback**: Highlight valid drop zones, ghost card while dragging

## Critical Rules

- **Do NOT break E2E tests.** All existing `data-testid` attributes must remain unchanged.
- **One round per iteration.** Complete one round, commit, update progress, exit.
- **Keep all existing functionality.** The current team selector must still work.
- **Dark theme everywhere.** Match the existing app aesthetic.
- **All UI text in Danish** — use `frontend/src/i18n/da.ts` for new strings.
- **Use `data-testid`** on all new interactive elements for future E2E testing.

## Completion Criteria

When ALL rounds are complete and ALL E2E tests pass, output:

```
<promise>SKJOLD_FORMATION_COMPLETE</promise>
```
