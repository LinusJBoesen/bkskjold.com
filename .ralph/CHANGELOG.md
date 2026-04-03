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
| 4 | ? | 2026-04-02 19:16 | iteration 4 |

---

## Iteration 5 — Round 5: Cross-Page Polish & Visual Consistency
**Date**: 2026-04-02

### Changes
- **frontend/src/pages/analysis/match.tsx**: Converted all 7 raw `<div className="bg-zinc-900/50 rounded-xl border border-zinc-800">` sections to use `<Card>/<CardHeader>/<CardContent>` shadcn/ui components, matching the pattern used in dashboard.tsx and training.tsx. Sections converted: summary cards, season overview, goals+assists chart, form timeline, DBU matches table, player highlights, and player stats table. Fixed duplicate `sm:text-xl sm:text-2xl` class in loading and error states (→ `sm:text-2xl`). Added `flex-wrap` to pending match action buttons for mobile overflow. Added `animate-stagger` to season overview stat tiles. Added `tabular-nums` to all numeric values in season overview tiles and goal/assist tooltip. Reduced summary card gap on mobile (`gap-3 sm:gap-4`).
- **frontend/src/pages/history/training.tsx**: Added `tabular-nums` to win rate tooltip numeric values for consistent number rendering.

### Decisions & Reasoning
- **Decision**: Converted all analysis page sections from raw divs to Card components
  **Why**: Dashboard and Training History pages consistently use `<Card>/<CardHeader>/<CardContent>` from shadcn/ui. The analysis page was using raw `<div>` elements with manual border/background classes, creating visual inconsistency (slightly different border radius, padding, and background opacity). Card components inherit the theme's `--card` CSS variable ensuring pixel-perfect consistency across all three pages.
- **Decision**: Added `tabular-nums` to all numeric displays across all pages
  **Why**: Without `tabular-nums`, numbers use proportional figures where "1" takes less horizontal space than "8". This causes values to visually shift when data updates (e.g., scores changing). Tabular figures ensure all digits are the same width, preventing layout jank — especially important in tables, stat cards, and tooltips.
- **Decision**: Added `flex-wrap` to pending match buttons instead of reducing button count
  **Why**: On mobile (375px), 4 action buttons ("Afslut kamp", "Hold 1 Vandt", "Hold 2 Vandt", delete) overflow the container. `flex-wrap` lets them flow to a second row naturally. Removing buttons would reduce functionality; `flex-wrap` preserves all options while fixing the overflow.
- **Decision**: Added `animate-stagger` to season overview grid
  **Why**: Dashboard stat cards and summary cards already have stagger animation. The season overview's 6 tiles were appearing instantly with no entrance animation, creating a jarring contrast with the rest of the page.
- **Decision**: Did not extract a shared PlayerAvatar component file
  **Why**: While PlayerAvatar is duplicated in all 3 pages, each version is a simple ~15-line function. Creating a shared component file adds import complexity and file navigation overhead for minimal benefit. Per project conventions, prefer simple solutions — extracting shared components can happen in a future round if the component grows more complex.

### Data Usage
- No new data sources used — this round was purely UI consistency and polish.
- All existing `data-testid` attributes verified: all 55 passing tests continue to pass.

### Next Iteration Ideas
- Head-to-head training vs DBU performance comparison
- Goal difference trend chart for DBU matches
- Player comparison feature (select 2 players, compare side by side)
- Sparkline charts in table cells for per-player trends
| 1 | 6 | 2026-04-02 19:41 | iteration 1 |

---

## Iteration 6 — Round 6: Top Scorers & Contributors on Dashboard
**Date**: 2026-04-02

### Changes
- **backend/src/routes/stats.ts**: Added `topContributors` query joining `players` and `match_events` tables — aggregates goals, assists, yellow cards, red cards, and clean sheets per player, filtered to those with at least 1 goal or assist, ordered by total contributions, limited to top 10. Added `eventTotals` query for aggregate goal/assist counts. Added `topContributors` array and `totals.goals`/`totals.assists` to the dashboard JSON response.
- **frontend/src/pages/dashboard.tsx**: Added `topContributors` and extended `totals` in the `DashboardData` interface. Added new "Topscorere & bidragydere" section between Recent Form and Charts, featuring: (1) a stacked horizontal bar chart (green=goals, blue=assists) showing top 10 contributors, (2) a ranked card list of top 5 with emoji-prefixed stats (⚽ goals, 🅰️ assists, 🧤 clean sheets, 🟨 cards), (3) aggregate totals footer. Added `Target` and `Star` icons from lucide-react. All new data fields use safe optional chaining for backward compatibility.
- **frontend/src/i18n/da.ts**: Added 6 new dashboard keys: `topContributors`, `goals`, `assists`, `yellowCards`, `totalGoals`, `totalAssists`.

### Decisions & Reasoning
- **Decision**: Surfaced `match_events` data on the dashboard (not just Kampanalyse)
  **Why**: The `match_events` table (goals, assists, cards, clean sheets) was only accessible on the Kampanalyse page. The dashboard is the most-visited page and had zero goal/assist data. For a football team app, seeing who's scoring is arguably the most engaging information — yet it required navigating to a separate page. Bringing it to the dashboard makes key sports data immediately visible.
- **Decision**: Used stacked bar chart + ranked card list (dual layout)
  **Why**: The bar chart gives a quick visual comparison of contributions across players. The ranked card list gives detailed per-player stats with emoji icons for quick scanning. Together they serve both glancers and detail-seekers. The 2-column grid layout on desktop mirrors the existing chart pairs on the dashboard.
- **Decision**: Aggregated on the backend, not frontend
  **Why**: The dashboard frontend doesn't fetch match_events data. Adding a new query to the existing `/api/stats/dashboard` endpoint keeps the frontend thin (single API call) and avoids an extra round-trip to `/api/analysis/player-rates`.
- **Decision**: Used emoji prefixes (⚽🅰️🧤🟨) for stat indicators in the card list
  **Why**: Emojis are universally understood in sports contexts and take less space than text labels. They provide instant visual recognition of stat types without needing to read labels, especially on mobile where horizontal space is tight.

### Data Usage
- **New**: `match_events` table now queried by dashboard endpoint — previously only used by `/api/analysis/player-rates`. Goals, assists, yellow cards, red cards, clean sheets aggregated per player.
- **New**: `totals.goals` and `totals.assists` — aggregate match event counts, displayed in the section footer.
- **Unused data noticed**: `bodekasse_expenses` table could power a "bødekasse balance" widget (total fines collected minus expenses). `player_positions` could enable position-based filtering or grouping of contributors.

### Next Iteration Ideas
- Bødekasse balance widget (fines collected vs expenses spent)
- Head-to-head training vs DBU performance comparison
- Goal difference trend chart for DBU matches
- Player comparison feature (select 2 players, compare side by side)
- Position-based grouping of stats using player_positions table
| 2 | 7 | 2026-04-02 19:59 | iteration 2 |

---

## Iteration 7 — Round 7: Bødekasse Balance Widget on Dashboard
**Date**: 2026-04-02

### Changes
- **backend/src/routes/stats.ts**: Added `bodekasse` balance query — runs two parallel queries: `SUM(amount) FROM fines WHERE paid = 1` for total collected and `SUM(amount) FROM bodekasse_expenses` for total spent. Returns `bodekasse: { totalCollected, totalSpent, remaining }` in the dashboard JSON response.
- **frontend/src/pages/dashboard.tsx**: Added `bodekasse` to `DashboardData` interface. Added `Wallet` icon import from lucide-react. Added bødekasse balance widget between totals cards and Top 3 section, featuring: (1) three-column layout showing collected (green), spent (red), and remaining balance, (2) a gradient progress bar showing percentage of funds spent vs collected.
- **frontend/src/i18n/da.ts**: Added 4 new dashboard keys: `bodekasse`, `collected`, `spent`, `balance`.

### Decisions & Reasoning
- **Decision**: Added bødekasse balance to dashboard (not a separate page)
  **Why**: The `bodekasse_expenses` table and `/api/bodekasse` endpoint already existed but the data wasn't surfaced on the dashboard. For a football team, "how much money is in the fine box?" is one of the most frequently asked questions. Making it visible on the main page eliminates the need to navigate elsewhere. The existing `/api/bodekasse` endpoint could be used, but adding the query directly to the stats endpoint avoids an extra API call from the frontend.
- **Decision**: Used a progress bar showing spent % (not a pie/donut chart)
  **Why**: The balance is fundamentally a "how much have we used?" question, which a linear progress bar answers more intuitively than a circular chart. Red gradient matches the "spending/expense" semantic. Stays compact — a chart would take up too much vertical space for just two data points.
- **Decision**: Placed widget between totals and Top 3 cards (not at the bottom)
  **Why**: Financial info is high-priority for team management. Placing it near the top ensures it's immediately visible without scrolling, right after the summary stats.
- **Decision**: Used safe optional chaining (`data?.bodekasse`)
  **Why**: Backward compatibility — if the frontend loads before the backend is updated, the widget simply doesn't render rather than crashing.

### Data Usage
- **New**: `bodekasse_expenses` table now queried by dashboard endpoint — previously only accessible via the dedicated `/api/bodekasse` route. Combined with paid fines total to show net balance.
- **Unused data noticed**: `spond_attendance` response data (accepted/declined/pending) could show player availability rates. `player_positions` table could enable position-based filtering. `lineup_formations` and `lineup_slots` could power a formation visualization.

### Next Iteration Ideas
- Head-to-head training vs DBU performance comparison
- Goal difference trend chart for DBU matches
- Player comparison feature (select 2 players, compare side by side)
- Position-based grouping of stats using player_positions table
- Spond attendance acceptance rate visualization
| 3 | 8 | 2026-04-02 20:21 | iteration 3 |

---

## Iteration 8 — Round 8: Goal Difference Trend Chart on Kampanalyse
**Date**: 2026-04-02

### Changes
- **frontend/src/pages/analysis/match.tsx**: Added `AreaChart`, `Area`, `CartesianGrid` imports from Recharts. Added `goalDiffTrend` useMemo computing cumulative goal difference from `dbuMatches` — reverses match order (chronological), parses home/away scores, accumulates the running goal difference per match. Added area chart section between Season Overview and Goals+Assists chart, featuring: gradient fill (green when positive, red when negative), color-coded dots per data point based on cumulative value, custom tooltip showing full opponent name, score, and cumulative difference, angled X-axis labels showing short opponent names, footer showing description and current total.
- **frontend/src/i18n/da.ts**: Added 3 new analysis keys: `goalDiffTrend` ("Målforskel over sæsonen"), `goalDiffCumulative` ("Kumulativ målforskel"), `goalDiffDesc` ("Kumulativ målforskel fra kamp til kamp").

### Decisions & Reasoning
- **Decision**: Used area chart (not line or bar) for goal difference trend
  **Why**: The gradient fill below/above the line gives a visceral sense of whether the team is trending positively or negatively. A line chart would feel too bare; bar charts would look disconnected. The area fill creates a "rising tide" or "sinking" visual that maps well to momentum.
- **Decision**: Placed chart between Season Overview and Goals+Assists sections
  **Why**: The season overview gives the summary numbers; the goal diff trend shows the story behind those numbers. Placing it right after creates a natural narrative flow: "here are your totals → here's how you got there → here's who contributed."
- **Decision**: Used cumulative goal difference (not per-match difference)
  **Why**: Per-match difference (+1, -2, +3) as bars would show individual match variance but not momentum. Cumulative goal difference shows the overall trajectory — whether the team is improving or declining over the season. This is the standard metric used in professional sports analytics (e.g., Premier League GD columns).
- **Decision**: Color-coded dots based on whether cumulative GD is positive or negative
  **Why**: Consistent with the rest of the app's color language (green=good, red=bad). Dots crossing from green to red (or vice versa) immediately show inflection points in the season.
- **Decision**: Gradient fill color matches the final cumulative value
  **Why**: Simplifies the visual — if the team is net positive overall, the fill is green; if net negative, red. Using a split gradient that changes mid-chart (above/below zero line) was considered but Recharts doesn't natively support this well and the added complexity wasn't worth it.

### Data Usage
- **Used**: `dbuMatches.score` and `dbuMatches.isHome` — already available and used for season overview. Now also parsed chronologically to compute running goal difference. No new API calls needed.
- **Unused data noticed**: `spond_attendance` response data could power attendance acceptance rates. `player_positions` table still unused. Training match results from `/matches` could be overlaid on the DBU trend for training-vs-competitive comparison.

### Failed Attempts & Dead Ends
- None — straightforward implementation. Considered using a ReferenceLine at y=0 from Recharts but decided the colored dots already communicate the zero-crossing well enough without adding visual clutter.

### Next Iteration Ideas
- Training vs competitive performance overlay (compare training win rate trend with DBU results)
- Per-player goal contribution sparklines in the stats table
- Spond attendance acceptance rate chart using spond_attendance response data
| 4 | 9 | 2026-04-02 20:36 | iteration 4 |

---

## Iteration 10 — Round 10: Dashboard KPI Deduplication & Declutter
**Date**: 2026-04-03

### Changes
- **frontend/src/pages/dashboard.tsx**: Removed "Betalt" (paid fines) stat card — was showing the exact same value as the bødekasse widget's "Indsamlet" (collected) field. Removed win rate distribution horizontal bar chart — was duplicating the Top 3 "Bedste sejrsrate" card (both show player win rates). Changed stat cards grid from `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` to `grid-cols-2 sm:grid-cols-4` for the now-4 cards. Removed `dashboard-fine-by-type` from nested 2-col grid into standalone full-width Card. Cleaned up unused imports: `CheckCircle` from lucide-react, `LineChart` and `Line` from Recharts (were imported but never used).

### Decisions & Reasoning
- **Decision**: Removed "Betalt" stat card rather than bødekasse "Indsamlet"
  **Why**: The bødekasse widget provides richer context (collected + spent + remaining balance with progress bar), while the stat card showed just one number. Keeping the widget and removing the card preserves more information density.
- **Decision**: Removed win rate distribution chart rather than Top 3 "Bedste sejrsrate" card
  **Why**: The Top 3 card is more compact and fits the dashboard's "at a glance" purpose — users see the top 3 instantly. The full 10-player horizontal bar chart duplicated this with more visual weight but less clarity. Win rate data is also derivable from the training results chart (which shows wins/losses per player). The Træningshistorik page has a dedicated win rate chart for deep-dive analysis.
- **Decision**: Made fine breakdown donut a standalone full-width card
  **Why**: Previously it was in a 2-col grid with the now-removed win rate chart. Leaving it alone in a 2-col grid would waste half the row. As a standalone card it still reads well since donut charts are inherently compact.
- **Decision**: Did not remove additional sections despite dashboard having 8+ widgets
  **Why**: Each remaining section now shows unique, non-overlapping data: totals (summary numbers), bødekasse (financial health), top 3 (leaderboards), recent form (streaks), top contributors (goals/assists), training results + fines per player (activity charts), fine breakdown (type distribution), attendance + activity (trends + timeline). Further reduction would lose unique insights.

### Data Usage
- No new data sources — this iteration was purely about removing duplicate presentations of existing data.
- The `paidFines` field is still returned by the API and used in the bødekasse widget indirectly. The `trainingChart.winRate` field is still available for the training results chart but no longer has its own dedicated chart on the dashboard.

### Failed Attempts & Dead Ends
- None — the duplicate identification was straightforward from reading the page.

### Next Iteration Ideas
- Kampanalyse page has similar duplication: player highlight cards show same data as goals+assists chart and player stats table — could consolidate
- Season overview "Spillermål" / "Spillerassists" tiles overlap with the goals+assists bar chart on the same page
- Consider collapsible sections or tabs to reduce vertical scroll on data-heavy pages
| 1 | 10 | 2026-04-03 18:21 | iteration 1 |

---

## Iteration 11 — Round 11: Kampanalyse KPI Deduplication
**Date**: 2026-04-03

### Changes
- **frontend/src/pages/analysis/match.tsx**: Removed `PlayerStatCard` component (47 lines) — was rendering per-player stat cards that duplicated both the Goals+Assists bar chart and the Player Stats table. Removed `activePlayers` useMemo — computed active players list only used by the now-removed PlayerStatCard section. Removed `eventTypeIcon` function — defined but never called anywhere. Removed `Shield` import from lucide-react — only used by the removed Player Highlights section header. Removed "Spillermål" and "Spillerassists" tiles from Season Overview grid (lines 646-653) — these showed aggregate player goals/assists totals that are already visualized in the Goals+Assists stacked bar chart directly below. Removed `totalPlayerGoals` and `totalPlayerAssists` from `seasonOverview` computed memo. Changed Season Overview grid from `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` to `grid-cols-2 sm:grid-cols-4` for the remaining 4 tiles (win rate, goals scored, goals conceded, clean sheets).

### Decisions & Reasoning
- **Decision**: Removed Player Highlights card section entirely rather than keeping a reduced version
  **Why**: The card section showed goals, assists, clean sheets, and cards per player — the exact same data as the Player Stats table below it, just in a different visual format. The Goals+Assists bar chart already provides the visual comparison that the cards attempted to offer. Keeping even a reduced card section would still duplicate the table. The table is more complete (shows all players, not just top 8) and more information-dense.
- **Decision**: Removed "Spillermål"/"Spillerassists" tiles rather than removing the bar chart
  **Why**: The bar chart provides per-player breakdown with visual comparison — much richer than two aggregate numbers. The tiles were just `reduce()` sums of the same data the chart visualizes. The remaining 4 tiles (win rate, goals scored/conceded, clean sheets) all show team-level DBU match data that isn't visualized elsewhere on the page.
- **Decision**: Changed Season Overview from 6-col to 4-col grid
  **Why**: With 4 tiles, a 6-col grid would leave 2 empty columns on large screens. `grid-cols-2 sm:grid-cols-4` gives a clean 2×2 on mobile and 1×4 on tablet+desktop.
- **Decision**: Removed `eventTypeIcon` function
  **Why**: Defined at line 76 but never called anywhere in the file. Likely leftover from an earlier iteration or copy-paste. Dead code removal.

### Data Usage
- No new data sources — this iteration was purely about removing duplicate presentations of existing data.
- Season Overview now shows only team-level DBU stats (win rate, goals scored/conceded, clean sheets). Per-player contribution data (goals, assists) is exclusively in the Goals+Assists bar chart and Player Stats table — no overlap.

### Failed Attempts & Dead Ends
- None — followed through on the duplication identified in Round 10's changelog.

### Next Iteration Ideas
- Consider collapsible sections or tabs on Kampanalyse to reduce vertical scroll (page still has 7 sections)
- The DBU Matches table and Form Timeline show overlapping data (both show match results chronologically) — could merge into a single enriched timeline
- Dashboard "Training Results" chart and "Fines per Player" chart could benefit from a shared filter (e.g., last N months)
| 2 | 11 | 2026-04-03 18:38 | iteration 2 |
| 3 | 11 | 2026-04-03 18:39 | iteration 3 |

---

## Iteration 12 — Round 12: Dashboard Top Contributors Deduplication
**Date**: 2026-04-03 19:30

### Changes
- **frontend/src/pages/dashboard.tsx**: Removed the contributor ranked card list (top 5 players with emoji stats) from the Top Contributors section. The section previously had a 2-column `grid-cols-1 lg:grid-cols-2` layout with a stacked bar chart on the left and card list on the right. Now it's a single-column layout with just the bar chart and totals footer. Removed the grid wrapper, leaving the `ResponsiveContainer` directly inside `CardContent`. Moved the totals footer (total goals + total assists) from inside the card list column to directly below the chart.

### Decisions & Reasoning
- **Decision**: Removed the contributor card list, kept the bar chart
  **Why**: The card list showed goals, assists, clean sheets, and yellow cards per player — the exact same data visualized in the stacked bar chart (goals + assists) right next to it. Per the design philosophy ("A data point must NOT appear more than once on the same page"), this was a clear duplication. The bar chart provides better visual comparison at a glance. Clean sheets and yellow cards were minor additions in the card list but are already visible on the Kampanalyse player stats table — showing them on the dashboard duplicates cross-page data.
- **Decision**: Kept the totals footer below the chart
  **Why**: The aggregate "Total mål" and "Total assists" counts are summary stats not shown elsewhere on the dashboard. They complement the per-player breakdown in the chart without duplicating it.
- **Decision**: Did not remove the entire Top Contributors section
  **Why**: Goal/assist data is unique to this section — no other dashboard widget shows who's scoring. It earns its place as the only match-event-based section on the dashboard.

### Data Usage
- No new data sources — purely UI deduplication of existing `topContributors` data.

### Failed Attempts & Dead Ends
- None — straightforward removal of duplicate presentation.

### Next Iteration Ideas
- Dashboard has 8 sections and is long — consider whether Recent Form (9 player cards) could be condensed to fewer players or a more compact layout
- The analysis page's 4 match-analysis E2E tests are timing out (pre-existing) — could investigate if the page has a rendering issue causing slow loads
| 1 | 12 | 2026-04-03 19:22 | iteration 1 |

---

## Iteration 13 — Round 13: Kampanalyse Sortable Player Stats Table
**Date**: 2026-04-03 20:00

### Changes
- **frontend/src/pages/analysis/match.tsx**: Added `StatSortKey` and `StatSortDir` types for sort state. Added `StatSortIcon` component (chevron up/down with red-400 active color, matching Træningshistorik's `SortIcon`). Added `statSort` state defaulting to `{ key: "goals", dir: "desc" }`. Added `sortedPlayerStats` useMemo — sorts `data.playerStats` by the selected column using `localeCompare` for names and numeric comparison for stats. Added `toggleStatSort` function — toggles direction if same key clicked, defaults to descending for new key. Made all 6 table headers (`th` elements) clickable with `cursor-pointer`, `select-none`, `hover:text-zinc-200` styling. Added `StatSortIcon` to each header showing active sort direction. Changed table body to iterate over `sortedPlayerStats` instead of `data.playerStats`. Added `ChevronUp` and `ChevronDown` imports from lucide-react.

### Decisions & Reasoning
- **Decision**: Made the Kampanalyse player stats table sortable (matching Træningshistorik's table)
  **Why**: The Træningshistorik page (Round 3) already has a fully sortable stats table with clickable headers and visual sort indicators. The Kampanalyse player stats table was static — users couldn't sort by goals, assists, or cards. This was an obvious UX inconsistency. Users visiting Kampanalyse expect the same interactive table behavior they see on Træningshistorik.
- **Decision**: Default sort by goals descending (not alphabetical)
  **Why**: The Kampanalyse page focuses on competitive match performance. Top scorers are the most interesting data point. Sorting by goals descending surfaces the most impactful players immediately, matching the page's analytical purpose. Træningshistorik defaults to win rate, which makes sense for that page's training context.
- **Decision**: Used a separate `StatSortIcon` component instead of importing from Træningshistorik
  **Why**: The existing `SortIcon` in training.tsx is a local component, not exported. Extracting shared components was explicitly deferred in Round 5 (see changelog). A 6-line component isn't worth the import overhead.
- **Decision**: Did not add MVP/worst highlighting to this table
  **Why**: The Kampanalyse table shows goals/assists/cards — there's no single "best" metric like win rate. Highlighting the top scorer would ignore the top assister. Keeping the table neutral lets users sort by whatever metric matters to them.

### Data Usage
- No new data sources — uses existing `data.playerStats` from `/api/analysis/player-rates`. Only changed how the data is rendered (sorted vs unsorted).

### Failed Attempts & Dead Ends
- None — straightforward implementation following the established pattern from Træningshistorik.

### Next Iteration Ideas
- The 4 analysis E2E tests are timing out (pre-existing) — could investigate if the page has a slow rendering or API issue
- Dashboard Recent Form section (9 player cards) takes significant vertical space — could condense to top 6 or a more compact horizontal layout
- Training Results and Fines Per Player charts use vertical bars with player names on X-axis — hard to read on mobile with many players; could convert to horizontal layout

---

## Iteration 14 — Round 14: Hold Udvælger Mobile UX Overhaul
**Date**: 2026-04-03 21:30

### Changes
- **frontend/src/pages/teams/selector.tsx**: Added `useMemo`, `Search`, `CheckSquare`, `Square` imports. Added `playerSearch` state for search filtering. Added `filteredSpondPlayers` and `filteredOtherPlayers` memos that filter player lists by search term. Added `selectAll()` and `deselectAll()` helper functions. Added search input with search icon at top of player list. Added "Alle"/"Ingen" quick action buttons next to the player count. Increased player row padding to `py-2.5 sm:py-1.5` for larger mobile touch targets. Added `active:bg-white/[0.07]` touch feedback on all player rows. Increased checkbox size to `h-4 w-4 sm:h-3.5 sm:w-3.5` for easier mobile tapping. Made PlayerAvatar responsive — `h-8 w-8` on mobile, `h-7 w-7` on desktop. Added `shrink-0` to avatars and win rate badges to prevent text wrapping issues. Changed mode toggle tabs from `flex` to `grid grid-cols-1 sm:grid-cols-2` so they stack on mobile. Made tab icons larger on mobile (`h-5 w-5 sm:h-4 sm:w-4`). Added thicker active tab borders (`border-2` vs `border`). Increased swap button size to `h-8 w-8 sm:h-6 sm:w-6` on mobile. Added "no results" message when search filter matches nothing. Changed player list max-height from `28rem` to `32rem` for better scrollability. Added `truncate` to player names to prevent overflow. Updated guest row spacing to match new player row sizing.

### Decisions & Reasoning
- **Decision**: Started the Hold Udvælger overhaul with mobile UX fundamentals (not new features)
  **Why**: Per the PROMPT.md priority directive, Hold Udvælger is the next major focus. The page already has solid functionality (two modes, formation view, team generation) but the mobile UX has small touch targets and no way to search/filter the player list. Improving the foundation first (touch targets, search, responsiveness) before adding new features like drag-to-reorder.
- **Decision**: Added search filter as the first new feature
  **Why**: With 15+ players on the list, finding and toggling specific players on a phone is tedious. A search box instantly narrows the list. This is the highest-impact mobile UX improvement for minimal code.
- **Decision**: Used `grid grid-cols-1 sm:grid-cols-2` for mode tabs instead of `flex`
  **Why**: On a 375px phone screen, two flex tabs with event dates squeeze uncomfortably. Stacking them vertically gives each tab full width, making the text and touch targets much more comfortable on mobile. Side-by-side still works on sm+ breakpoints.
- **Decision**: Kept `active:bg` feedback on touch instead of adding a ripple effect
  **Why**: The existing design uses hover-only feedback, which is invisible on touch devices. Adding `active:bg-white/[0.07]` gives immediate visual feedback when a player row is tapped, without needing any JavaScript animation library. Simple and consistent with the existing design language.
- **Decision**: Made swap buttons 33% larger on mobile (h-8 vs h-6)
  **Why**: The swap button between teams is the most frequently tapped action after generating teams. At h-6 (24px) it's below Apple's 44px minimum recommended touch target. At h-8 (32px) it's still not 44px but significantly more comfortable, and larger would look disproportionate.

### Data Usage
- No new backend data — all changes are frontend-only UX improvements.
- The `filteredSpondPlayers` and `filteredOtherPlayers` memos use existing `spondPlayers` and `otherPlayers` arrays, filtering by `displayName`.

### Failed Attempts & Dead Ends
- None — all changes were straightforward responsive CSS and React state additions.

### Next Iteration Ideas
- Add position badges next to player names in the selection list (showing their preferred positions from `player_positions`)
- Implement tap-to-move between teams — tap a player in Team 1 list to move them to Team 2 (currently requires the small swap button)
- Add a "smart generate" option that uses position data to balance teams by position distribution, not just win rate
- Consider a mobile-optimized "card view" instead of the current checkbox list — swipe right to select, left to deselect
