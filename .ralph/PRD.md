# Match Details — PRD

## Goal

Make every match in the app clickable to open a rich detail view. For upcoming matches, show practical info (location, kickoff time, venue) pulled from Spond. For any DBU league match, additionally show head-to-head history, the opponent's full season results, and a "common opponents" comparison (how they fared vs teams we've also faced). This turns the matches list from a passive table into a decision-support tool for match prep.

---

## Rounds

### Round 1: Spond — Location & Kickoff Enrichment

Extend the Spond sync to capture the data Spond already returns but we currently drop. Note: DBU's `/kampprogram` *also* exposes kickoff time + venue (confirmed live), so if Spond data is missing for a given match, Round 3's aggregation can fall back to DBU. Don't block this round on Spond edge cases.

- [ ] Add columns to `spond_events`: `location_name`, `location_address`, `end_timestamp` (migration-safe — add via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` pattern or check schema version)
- [ ] Update `backend/src/services/spond.ts` to extract `location.feature`, `location.address`, `endTimestamp` from the Spond payload (inspect payload shape; they may live under `location` or `owners` — log one raw event to confirm before parsing)
- [ ] Update seed.ts so seeded Spond events include plausible location data
- [ ] Expose enriched fields in `GET /api/matches/:id` and in any endpoint that returns Spond events
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): enrich Spond events with location and kickoff`

### Round 2: DBU — Per-Team Match History Scraper

Extend the DBU scraper to fetch all matches a given team has played (not just our own).

**Verified site structure** (checked live on DBU 2026-04-19):
- `/resultater/hold/{teamId}/kampprogram` works for any team (teamId shape: `460174_489363` = `{holdId}_{puljeId}`)
- Kampprogram table columns are `[icon, Kampnr, Dato, Tid, Hjemme, Ude, Spillested, Resultat]` — cell[3] is kickoff time (`"19:45"`), cell[6] is venue (`"Ryparken Idrætsanlæg"`)
- The home/away team cells (`cells[4]`, `cells[5]`) render team names as `<a href="/resultater/hold/{teamId}">`. **Parse `querySelector('a').getAttribute('href')` and regex-extract the teamId** — this is the reliable way to map opponent name → team_id
- Per-match detail page exists at `/resultater/kamp/{matchId}/kampinfo` (out of scope for this round — note for later)

Tasks:
- [ ] Extend `scrapeMatchHistory` (or add `scrapeTeamMatches(teamId)`) to also extract `time` (cell[3]), `venue` (cell[6]), opponent `team_id` from anchor href in cells[4]/cells[5], **and `dbu_match_id` from the icon-link href in cells[0] (`/resultater/kamp/{matchId}/kampinfo` — strip the `/kampinfo` suffix)**
- [ ] Add `scrapeTeamMatches(teamId)` returning `{dbu_match_id, date, time, home_team, home_team_id, away_team, away_team_id, venue, home_score, away_score}[]` with 1h in-memory cache keyed by `teamId`
- [ ] Add `dbu_team_matches` table: `(dbu_match_id TEXT PRIMARY KEY, team_id TEXT, date TEXT, time TEXT, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue, synced_at)`
- [ ] Also backfill `dbu_match_id` on the existing `dbu_matches` table (ALTER TABLE + re-scrape our team on next sync)
- [ ] Expose `GET /api/dbu/teams/:teamId/matches` that returns cached or freshly-scraped data
- [ ] Helper: `getOpponentTeamId(opponentName)` — derives the team_id from our own cached kampprogram rows (since the anchor href is captured during scraping, no separate lookup against standings is needed)
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): scrape per-team DBU match history`

### Round 3: Head-to-Head + Common Opponents Aggregation

Build the aggregation logic that turns raw per-team match history into comparative insight.

- [ ] Add `GET /api/matches/:id/details` endpoint that returns:
  - Core match info (date, opponent, location, kickoff, score if played)
  - Head-to-head: all prior meetings between us and this opponent (from `dbu_matches`)
  - Opponent season record: wins/losses/draws, goals for/against (derived from their full match history)
  - Common opponents: for each team both we and the opponent have played, show our result vs their result (side-by-side)
- [ ] Write the aggregation in a new file `backend/src/services/match-details.ts` — do not bloat the route handler
- [ ] Unit-level sanity: add a small script or inline test that exercises the common-opponents logic with seeded fixtures
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): match details aggregation endpoint`

### Round 4: Frontend — Match Detail Page + Clickable Rows

Wire the UI so every DBU match row becomes clickable and opens a detail page.

- [ ] Add route `/matches/:id` in `App.tsx` pointing to new `pages/matches/detail.tsx`
- [ ] Make match rows clickable in: `pages/tournament/standings.tsx`, `pages/analysis/match.tsx`, and dashboard's upcoming/recent match widgets
- [ ] Detail page hero section: opponent name, date, kickoff time, venue with address, home/away indicator, score if completed
- [ ] "Åbn i Google Maps" link if address is present
- [ ] Loading/empty/error states
- [ ] i18n strings in `frontend/src/i18n/da.ts`
- [ ] `data-testid` on all interactive elements (`match-detail-*`)
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): match detail page with clickable rows`

### Round 5: Frontend — Head-to-Head & Common Opponents Sections

Visualize the comparative data from Round 3 on the detail page.

- [ ] Head-to-head section: list of prior meetings with date, home/away, score, win/loss indicator (red/green accent)
- [ ] Opponent season snapshot: W/D/L pills, goals for/against, recent form (last 5 as W/D/L chips)
- [ ] Common opponents table: opponent team | our result | their result | delta indicator
- [ ] Use shadcn/ui Card + Table, Recharts only if genuinely adds clarity (not for the sake of charts)
- [ ] Mobile-responsive — sections stack on < lg
- [ ] Skeleton loaders while data is fetching
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): head-to-head and common opponents on match detail`

### Round 6: DBU Kampinfo — Referee, Lineups, Goal Scorers

Scrape the per-match DBU detail page (`/resultater/kamp/{dbu_match_id}/kampinfo`) for richer context and surface it on the frontend match detail page.

**Verified site structure** (checked live on DBU 2026-04-19):
- URL pattern: `https://www.dbu.dk/resultater/kamp/{dbu_match_id}/kampinfo` (e.g. `913776_489363`)
- Page exposes: kickoff date+time, stadium name, stadium address (postal + city), pitch label (e.g. "Kunst 2B"), competition name, pool, referee, full home + away rosters (player names), team officials ("holdleder"), goal scorers with goal counts
- Does NOT expose: lat/lng coordinates, attendance, cards, minute-by-minute events

Tasks:
- [ ] Add `scrapeMatchInfo(dbu_match_id)` in `backend/src/services/dbu.ts` returning `{referee, venue_name, venue_address, pitch, home_lineup: string[], away_lineup: string[], home_officials: string[], away_officials: string[], goal_scorers: {name, team, goals}[]}` — with 1h in-memory cache keyed by `dbu_match_id`
- [ ] Add `dbu_match_info` table: `(dbu_match_id TEXT PRIMARY KEY, referee TEXT, venue_name TEXT, venue_address TEXT, pitch TEXT, home_lineup TEXT, away_lineup TEXT, home_officials TEXT, away_officials TEXT, goal_scorers TEXT, synced_at)` — lineups/scorers stored as JSON strings
- [ ] Expose `GET /api/dbu/matches/:dbuMatchId/info` that returns cached or freshly-scraped data; lazy-fetches on first request
- [ ] Extend `GET /api/matches/:id/details` (Round 3 endpoint) to optionally include `match_info` when the match has a `dbu_match_id`
- [ ] Frontend: add a "Kampfakta" section on the match detail page showing referee, pitch, scorers (with goal counts, rendered as pill chips), and collapsible lineups (home + away) — use shadcn/ui `Collapsible` or `Accordion` if available, otherwise a simple toggle
- [ ] i18n strings: `kampfakta`, `dommer`, `bane`, `maalscorere`, `opstilling_hjemme`, `opstilling_ude`, `holdleder`
- [ ] Handle missing data gracefully (some matches may lack rosters or scorers — render "Ingen data" rather than empty section)
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): DBU kampinfo scraping and match-detail kampfakta section`

### Round 7: Polish, Dashboard Integration, E2E Coverage

Final polish and test coverage for the new page.

- [ ] Add "Næste kamp" dashboard card linking to the detail page for the next upcoming DBU match
- [ ] Verify match detail renders correctly for: upcoming match (no score), completed match, match with missing Spond location, match against an opponent with no DBU history, match with no kampinfo yet scraped
- [ ] Add E2E spec `e2e/specs/matches/detail.spec.ts` covering: click from standings → lands on detail, all sections render (hero, H2H, common opponents, kampfakta), back navigation works
- [ ] Verify dark theme consistency, transitions, accessibility (keyboard nav on clickable rows)
- [ ] Run full E2E suite — all pass
- [ ] Commit: `feat(skjold): match detail polish and E2E coverage`

---

## Technical Notes

- All UI text in Danish via `frontend/src/i18n/da.ts`
- Follow existing dark theme (zinc-950, zinc-900/50, red #D42428)
- Use `data-testid` on all new interactive elements, namespace: `match-detail-*`
- Do not break existing E2E tests — check `data-testid` attributes remain unchanged
- DBU scraping must stay polite: 1-hour in-memory cache per team, respect existing patterns in `dbu.ts`
- Internal training matches (the `matches` table with team1/team2 of our own players) are **out of scope** — this loop only touches DBU/external opponent matches. If a round accidentally affects training matches, revert and rescope.

## Success Criteria

1. All 7 rounds completed with commits
2. All existing E2E tests still pass
3. New E2E spec for match detail page passes
4. Clicking any DBU match row opens a detail page showing location, kickoff, head-to-head, opponent season, common opponents, and kampfakta (referee/lineups/scorers)
5. Code follows existing conventions; no regressions on dashboard, fines, teams, training history, analysis, tournament, admin pages
