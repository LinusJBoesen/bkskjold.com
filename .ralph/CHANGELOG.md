# Ralph Loop Changelog — Match Details

| Iteration | Round | Timestamp | Summary |
|-----------|-------|-----------|---------|
| 1 | Round 1 | 2026-04-19 | Added location_name, location_address, end_time to spond_events. Updated Spond client, sync route, seed data, and all endpoints returning spond events. Fixed test seed to clear DBU data before insert. |
| 1 | ? | 2026-04-19 19:55 | iteration 1 |
| 2 | Round 2 | 2026-04-19 | Added scrapeTeamMatches with 1h cache, dbu_team_matches table, dbu_match_id on dbu_matches, GET /api/dbu/teams/:teamId/matches endpoint, getOpponentTeamId helper, seed data for team matches. |
| 2 | ? | 2026-04-19 20:02 | iteration 2 |
| 3 | Round 3 | 2026-04-19 | Added match-details aggregation service with H2H, opponent season, common opponents. Added GET /api/matches/:id/details endpoint. Seeded opponent (Vanløse IF) team matches for common opponents testing. Unit test for common-opponents logic passes. |
| 3 | ? | 2026-04-19 20:09 | iteration 3 |
| 4 | Round 4 | 2026-04-19 | Added match detail page at /matches/:id with hero section (teams, score, date, kickoff, venue, Google Maps link). Made DBU match rows clickable in tournament standings and analysis pages. Added dbuMatchId to tournament and analysis API responses. Added i18n strings. |
| 4 | ? | 2026-04-19 20:16 | iteration 4 |
| 5 | Round 5 | 2026-04-19 | Added head-to-head section with W/D/L result badges, opponent season snapshot (W/D/L pills, goals, recent form chips), common opponents comparison table. Skeleton loaders for loading state. Mobile-responsive grid layout (stacks below lg). Added i18n strings for all new sections. |
| 5 | ? | 2026-04-19 20:21 | iteration 5 |
| 6 | Round 6 | 2026-04-19 | Added scrapeMatchInfo scraper for DBU kampinfo pages (referee, lineups, officials, scorers). Added dbu_match_info table. Added GET /api/dbu/matches/:dbuMatchId/info endpoint with lazy-fetch. Extended /api/matches/:id/details to include matchInfo. Added Kampfakta section to frontend detail page with referee, pitch, goal scorer pills, collapsible lineups, officials. Added i18n strings. |
| 6 | ? | 2026-04-19 20:29 | iteration 6 |
| 7 | Round 7 | 2026-04-19 | Added "Næste kamp" dashboard card linking to match detail. Added upcoming match to test seed. Added keyboard navigation (tabIndex, onKeyDown, focus-visible) to all clickable match rows. Created E2E spec with 11 tests covering navigation, hero, H2H, common opponents, kampfakta, back nav, error state, dashboard card. All tests pass (7 pre-existing failures unchanged). |
| 7 | ? | 2026-04-19 20:41 | iteration 7 |
| 8 | ? | 2026-04-19 20:45 | iteration 8 |
