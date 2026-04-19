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
