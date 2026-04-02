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
---

## Iteration 3 — Round 3: Træningshistorik Charts, Sortable Stats, Form Streaks
**Date**: 2026-04-02

### Changes
- **frontend/src/pages/history/training.tsx**: Complete upgrade of the training history page:
  - Added Recharts imports (BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell) for horizontal win rate bar chart.
  - Added `FormDot` component — colored circles with Danish letters (S/T/U) showing each player's last 5 match results.
  - Added `StreakBadge` component — shows active win/loss streaks with flame icon (e.g., "3S" for 3 wins in a row).
  - Added `SortIcon` component — chevron indicators for sortable table columns.
  - Added `WinRateBarTooltip` custom tooltip for the bar chart (shows player name, win rate, W/L/total breakdown).
  - Added `statSort` state (`SortKey` + `SortDir`) for sortable table — supports sorting by name, matches, wins, losses, win rate.
  - Added `playerFormMap` computed from matches data — derives last 5 W/L/D per player without an extra API call.
  - Added `winRateChartData` — top 15 players by win rate, color-coded bars (green ≥60%, amber ≥40%, red <40%).
  - Added `bestId`/`worstId` computation — highlights MVP (best win rate, ≥2 matches) with emerald left border and "MVP" badge, worst with red left border.
  - Added `formatDate` helper for Danish-formatted dates on match cards.
  - Improved match history cards: score now in a pill-shaped badge, teams shown in separate colored boxes (emerald border for winning team), trophy emoji for winner, draw state handled, responsive grid (stacked on mobile).
  - Form column added to stats table (hidden on mobile with `hidden sm:table-cell`).
  - All table headers now clickable for sorting with visual sort direction indicators.
- **frontend/src/i18n/da.ts**: Added `history` section with keys: winRateChart, playerStats, matchHistory, name, matchesCol, winsCol, lossesCol, winRate, form, matchesPlayed.

### Decisions & Reasoning
- **Decision**: Computed form data on the frontend from already-fetched matches, not via a new API call
  **Why**: The page already fetches `/matches` with full player arrays. Computing W/L per player from this avoids adding a backend endpoint or duplicating the dashboard's `playerForm` call. Keeps the page self-contained.
- **Decision**: Horizontal bar chart for win rate (not vertical or radar)
  **Why**: Consistent with the dashboard's win rate chart from Round 1. Horizontal bars with player names on Y-axis are the most readable for percentage comparison — users scan top-to-bottom like a leaderboard.
- **Decision**: Color-coded bars by win rate threshold (green ≥60%, amber ≥40%, red <40%)
  **Why**: Gives immediate visual feedback without needing to read exact numbers. Three tiers is enough to distinguish strong, average, and weak performance.
- **Decision**: MVP badge only for players with ≥2 matches
  **Why**: A player with 1 match and 1 win has 100% win rate but that's not meaningful. ≥2 matches filters out noise while still being generous for small datasets.
- **Decision**: Form column hidden on mobile (`hidden sm:table-cell`)
  **Why**: Mobile tables are already tight with 5 columns. The form dots add 100px+ of width. Hiding on mobile keeps the table readable; users can rotate to landscape or use desktop for the full view.
- **Decision**: Match cards redesigned with team boxes instead of inline text
  **Why**: The original layout had "Hold 1: name, name, name" as flat text. Separate boxes with colored borders make it instantly clear which team won. The visual weight matches the importance of the information.

### Data Usage
- **Used**: `/matches` player arrays — derived per-player form (W/L/D last 5) directly from match data already fetched.
- **Used**: `/matches/stats/all` — powers the sortable table and win rate bar chart. No schema changes needed.
- **Unused data noticed**: `match_events` table (goals, assists, cards) not used on this page — relevant for Kampanalyse in Round 4. `profile_picture` from stats used for avatars in table rows.

### Next Iteration Ideas
- Round 4: Kampanalyse page — goals/assists bar chart, form timeline, season overview
- Could add per-player detail expansion in the stats table (click row to see match-by-match breakdown)
- Could add win rate trend sparklines per player in the form column
| 3 | ? | 2026-04-02 19:05 | iteration 3 |

---

## Iteration 4 — Round 4: Kampanalyse Visual Stats, Charts & Season Overview
**Date**: 2026-04-02 19:10

### Changes
- **frontend/src/pages/analysis/match.tsx**: Major upgrade to the Kampanalyse page:
  - Added Recharts imports (BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell) for goals+assists stacked bar chart.
  - Added `GoalAssistTooltip` — custom dark-themed tooltip showing player name, goals, and assists.
  - Added `FormDot` component — colored circles with Danish letters (S/T/U) for the form timeline.
  - Added `PlayerStatCard` component — visual card per player showing emoji-prefixed stats (goals, assists, clean sheets, cards).
  - Added `seasonOverview` computed from DBU match scores — parses scores to calculate total goals scored/conceded, clean sheets, and win rate percentage.
  - Added `goalAssistChart` — top 12 players by combined goals+assists, stacked horizontal bar chart (green=goals, blue=assists).
  - Added `activePlayers` — filters and sorts players with any contributions for visual card display.
  - Added Season Overview section with 6 stat tiles: win rate %, goals scored, goals conceded, clean sheets, player goals, player assists.
  - Added Goals + Assists bar chart section with stacked horizontal bars and legend.
  - Added Form Timeline section — DBU match results displayed chronologically as colored dots (S/T/U) with opponent names below.
  - Added Player Highlights section — top 8 contributing players shown as visual stat cards in a responsive grid.
  - Kept the full player stats table below the visual cards for complete data access.
  - Added lucide-react icons: Target, Shield, TrendingUp for section headers.
  - Added `useMemo` for all computed data to prevent unnecessary recalculations.
- **frontend/src/i18n/da.ts**: Added 10 new analysis keys: `seasonOverview`, `topScorers`, `formTimeline`, `playerHighlights`, `goalsScored`, `goalsConceded`, `cleanSheetsTotal`, `winRatePct`, `playerGoals`, `playerAssists`, `noContributions`.

### Decisions & Reasoning
- **Decision**: Used stacked horizontal bar chart for goals + assists (not grouped or vertical)
  **Why**: Stacked bars show total contribution (goals + assists combined) while still distinguishing between the two. Horizontal layout with player names on Y-axis is consistent with the win rate charts from Rounds 1/3. Green for goals, blue for assists — intuitive sports color coding.
- **Decision**: Parsed goals scored/conceded from DBU match score strings (e.g. "3-1")
  **Why**: This data isn't available as separate fields from the API — only the combined score string. Parsing it is lightweight and gives us season-level aggregated stats that weren't shown anywhere before.
- **Decision**: Form timeline uses simple dots, not a line chart
  **Why**: With ~10-15 DBU matches per season, a line chart would be sparse and hard to read. Discrete colored dots with opponent labels underneath give a clear chronological view of form without interpolation between points.
- **Decision**: Visual player cards shown for top 8 contributors, full table kept below
  **Why**: Cards give quick visual scanning for the most active players. Keeping the table preserves full data access for all players. 8 cards fills a 4-column grid neatly (2 rows) without overloading the page.
- **Decision**: Used `useMemo` for all derived data
  **Why**: The page re-renders when any state changes (e.g. toggling post-match card). Memoizing chart data and season stats prevents re-computing on every render.

### Data Usage
- **Used**: `dbuMatches.score` — parsed score strings to derive goalsScored/goalsConceded/cleanSheets for season overview. Previously only used for display in the matches table.
- **Used**: `dbuSummary` — win rate percentage now calculated and displayed prominently in season overview.
- **Used**: `playerStats` (goals, assists, cleanSheets, yellowCards, redCards) — now powers both the bar chart and visual stat cards, in addition to the existing table.
- **Used**: `dbuMatches.result` — now visualized as a form timeline with colored dots.
- **Unused data noticed**: `spond_attendance` response data (accepted/declined) could show player availability rates. Training match results from `/matches` could be cross-referenced with DBU match performance.

### Next Iteration Ideas
- Round 5: Cross-page visual consistency, mobile polish, animations
- Could add head-to-head comparison between training performance and DBU match performance
- Could add goal difference trend chart for DBU matches
- Could add player comparison feature (select 2 players, compare stats side by side)
