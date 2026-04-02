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
