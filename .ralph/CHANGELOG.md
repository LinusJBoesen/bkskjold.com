# Ralph Loop Changelog — Dashboard & Stats Upgrade

Each iteration documents all changes, decisions, and reasoning so you can review progress in real time.

---

## Iteration 1 — Round 1: Dashboard Charts & Form Indicators
**Date**: 2026-04-02

### Changes
- **backend/src/routes/stats.ts**: Added `recentForm` SQL query joining match_players, matches, and players to get W/L/D results per player ordered by date. Added `getStreak()` helper function. Added `playerForm` array to response with last 5 match results and current streak per player.
- **frontend/src/pages/dashboard.tsx**: Added PieChart/Pie/Cell imports from Recharts. Added `playerForm` to DashboardData interface. Added `DONUT_COLORS` palette (8 colors). Added `FormBadge` component showing S/T/U badges with color coding. Added `StreakBadge` component showing streak text. Added donut chart for fine breakdown by type. Added horizontal bar chart for win rate distribution (top 10 players). Added "Seneste form" section with player cards showing last 5 match results and streak. Replaced hardcoded Danish strings with i18n references.
- **frontend/src/i18n/da.ts**: Added `dashboard` section with keys: recentForm, trainingResults, finesPerPlayer, fineBreakdown, winRateDistribution, winRate, winsInARow, lossesInARow.

### Decisions & Reasoning
- **Decision**: Used donut chart (not bar chart) for fine breakdown by type
  **Why**: Donut charts better show proportional distribution — users want to see "what % of fines come from each type" rather than absolute amounts side by side. The inner radius also leaves room for a future center label.
- **Decision**: Used horizontal bar chart for win rate distribution (not radar or vertical bars)
  **Why**: Horizontal bars with player names on Y-axis are the most readable for comparing percentages across players. Radar charts become unreadable with more than 6 data points. Sorted descending for quick leaderboard scanning.
- **Decision**: Form badges use Danish abbreviations (S/T/U) not English (W/L/D)
  **Why**: All UI must be in Danish per project conventions. S=Sejr, T=Tab, U=Uafgjort.
- **Decision**: Show top 9 players in form section (3x3 grid)
  **Why**: 9 fits a 3-column grid perfectly on desktop, and stacks cleanly on mobile. Showing all players would clutter the dashboard.
- **Decision**: Added streak calculation on the backend, not frontend
  **Why**: The backend already processes the raw match data, so computing streaks there avoids redundant logic and keeps the frontend thin.

### Data Usage
- **Used**: `fineByType` data from `/api/stats/dashboard` — was returned by backend but completely unused in frontend. Now powers the donut chart.
- **Used**: `trainingChart.winRate` — was already returned but only used implicitly. Now powers the dedicated win rate bar chart.
- **New**: `playerForm` — new data source added to backend, provides last 5 match results and streak per player.
- **Unused data noticed**: `spond_attendance` table could power attendance trends (Round 2). `match_events` table has goals/assists/cards data unused on dashboard.

### Next Iteration Ideas
- Attendance/participation trend chart using spond_attendance data
- Recent activity feed (latest fines, completed matches)
- Responsive grid polish for mobile
- Dark theme tooltip polish across all charts
---

## Iteration 2 — Round 2: Activity Feed, Attendance Trend, Responsive Polish
**Date**: 2026-04-02

### Changes
- **backend/src/routes/stats.ts**: Added `attendanceTrend` query — counts distinct players per completed match, ordered by date, for a line/area chart showing participation over time. Added `recentActivity` — queries last 5 fines (with player name, fine type, amount) and last 5 completed matches (with player count), merges and sorts by date descending, returns top 10 events. Added `totalMatches` count to the totals object.
- **frontend/src/pages/dashboard.tsx**: Added `AreaChart`, `Area`, `LineChart`, `Line` imports from Recharts. Added `Activity`, `Clock`, `Swords` icons from lucide-react. Extended `DashboardData` interface with `attendanceTrend`, `recentActivity`, and `totals.matches`. Added attendance trend area chart with red gradient fill and date-formatted X-axis. Added recent activity feed with icon-differentiated event cards (red for fines, green for matches) and Danish date formatting. Added "Kampe" stat card to the totals row. Changed totals grid from `grid-cols-2 sm:grid-cols-4` to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` for the new 5th card. Reduced gap on mobile (`gap-3 sm:gap-4`). Made header title responsive (`text-xl sm:text-2xl`). Added safe optional chaining (`?.length ?? 0`) on new data arrays to handle backward-compatible API responses.
- **frontend/src/i18n/da.ts**: Added dashboard keys: `attendanceTrend`, `recentActivity`, `players`, `matches`, `fine`, `match`.

### Decisions & Reasoning
- **Decision**: Used area chart (not line chart) for attendance trend
  **Why**: The gradient fill under the line gives a stronger visual sense of volume/participation over time. A bare line chart looks too sparse with few data points. The red gradient ties into the brand color (#D42428).
- **Decision**: Combined fines + matches into a single activity feed (not separate sections)
  **Why**: A unified timeline gives a better sense of "what's happening" — users see the chronological flow of team events. Separate sections would fragment the narrative.
- **Decision**: Used safe optional chaining on new data fields
  **Why**: If the frontend loads before the backend is updated (or data is cached), `attendanceTrend` and `recentActivity` would be undefined. Safe access prevents React crashes without requiring a full page reload.
- **Decision**: Added 5th stat card (Kampe/Matches) to the totals row
  **Why**: Match count was available but not displayed. 5 cards work well with `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` — on mobile you get 2+2+1, on tablet 3+2, on desktop all 5 in a row.
- **Decision**: Kept sync button text unchanged (not shortened for mobile)
  **Why**: The E2E test `spond-sync.spec.ts` asserts exact text "Synkronisér Data" — changing it would break the test. Used `size="sm"` and `shrink-0` instead for better fit.

### Data Usage
- **New**: `attendanceTrend` — derived from `matches` + `match_players`, counting distinct players per completed match over time.
- **New**: `recentActivity` — combines data from `fines` (with player names, fine types) and `matches` (with player counts) into a unified timeline.
- **New**: `totals.matches` — simple count of completed matches, displayed in stat card.
- **Unused data noticed**: `spond_attendance` table has response data (accepted/declined) that could show acceptance rates. `match_events` table has goals/assists/cards still unused on dashboard.

### Next Iteration Ideas
- Round 3: Træningshistorik page — win rate bar chart per player, form streaks, sortable stats table
- Could add spond attendance acceptance rate to the attendance trend chart
- Could add goals/assists leaderboard to dashboard using match_events data
