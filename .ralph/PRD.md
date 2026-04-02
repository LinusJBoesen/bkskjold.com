# Dashboard & Stats Upgrade — PRD

## Goal

Make the Dashboard, Træningshistorik, and Kampanalyse pages significantly better — more charts, smarter data usage, more intuitive UI, and modern responsive design. After the defined rounds, keep iterating: review data usage, visual quality, mobile UX, and statistical insights endlessly.

---

## Rounds

### Round 1: Dashboard — More Charts & Polish

- [ ] Add a donut/pie chart for fine breakdown by type (backend already returns `fineByType` data — it's unused)
- [ ] Add a win rate distribution chart (e.g. horizontal bar or radar showing each player's win %)
- [ ] Add recent form/streak indicators to the Top 3 cards or as a new section (last 5 matches W/L per player)
- [ ] Polish stat cards and layout — ensure good spacing, consistent sizing, better visual hierarchy
- [ ] All new i18n strings in `da.ts`
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): dashboard charts upgrade — fine breakdown, win rate, form streaks`

### Round 2: Dashboard — Activity Feed & Responsive Polish

- [ ] Add attendance/participation trend over time (line chart showing how many players attend training over weeks/months)
- [ ] Add a "recent activity" section — latest fines, completed matches, new players (last ~10 events)
- [ ] Improve responsive grid — make dashboard shine on mobile (stacked cards, swipeable charts)
- [ ] Ensure all charts have proper dark theme tooltips and legends
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): dashboard activity feed, attendance trends, responsive polish`

### Round 3: Træningshistorik — Charts & Smart Stats

- [ ] Add a win rate bar chart per player (horizontal bars, sorted by win rate, color-coded)
- [ ] Add form streaks — visual W/L indicators for each player's last 5-10 matches (colored dots or badges)
- [ ] Make the stats table sortable (click headers to sort by wins, losses, win rate, matches)
- [ ] Add visual highlights — best/worst win rates get special styling
- [ ] Improve match history cards with better layout and more info
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): træningshistorik charts, sortable stats, form streaks`

### Round 4: Kampanalyse — Visual Stats & Charts

- [ ] Add a goals + assists bar chart (top scorers/assisters visualized)
- [ ] Add a form timeline — win/draw/loss shown as colored dots or a streak chart over the season
- [ ] Improve player stats section — make it more visual (stat cards or mini charts per player instead of just a table)
- [ ] Add a "season overview" section with key stats highlighted (goals scored, conceded, clean sheets total)
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): kampanalyse visual stats, charts, season overview`

### Round 5: Cross-Page Polish & Consistency

- [ ] Review all three pages for visual consistency (same card styles, chart themes, spacing, typography)
- [ ] Ensure all pages are fully mobile-friendly — test at 375px, 768px, 1024px widths
- [ ] Check that all existing `data-testid` attributes still work
- [ ] Smooth animations and transitions on all new elements
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): cross-page polish, mobile UX, visual consistency`

### Round 6+: Continuous Improvement (Infinite)

After all defined rounds are complete, enter review-and-improve mode. Each iteration:

1. **Read** `CLAUDE.md` and current page code
2. **Review** all three pages critically:
   - Are we using ALL available data from the backend? Query the DB schema for unused columns/tables
   - Are the charts the best chart type for the data? (bar vs line vs radar vs donut)
   - Is the UI modern and clean? Compare against best-in-class sports dashboards
   - Is it mobile-friendly? Check layouts at small breakpoints
   - Are tooltips, legends, and labels clear and helpful?
   - Can we derive smarter insights? (trends, averages, comparisons, rankings)
3. **Pick** the single most impactful improvement and implement it
4. **Run E2E tests** — all pass
5. **Update** progress.txt with what you improved
6. **Commit** with a descriptive message

Never output a completion promise. Just keep improving.

---

## Technical Notes

- All UI text in Danish via `frontend/src/i18n/da.ts`
- Charts use Recharts (already in the project)
- Follow existing dark theme (zinc-950, zinc-900/50, red #D42428)
- Use shadcn/ui components where available
- Use `data-testid` on all new interactive elements
- Do not break existing E2E tests
- Backend data sources: `/api/stats/dashboard`, `/api/matches/stats/all`, `/api/analysis/player-rates`, `/api/matches`
- The `fineByType` data is already returned by the dashboard endpoint but unused in the frontend
