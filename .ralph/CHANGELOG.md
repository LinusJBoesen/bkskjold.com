# Ralph Loop Changelog — Match Details

| Iteration | Round | Timestamp | Summary |
|-----------|-------|-----------|---------|
| 1 | Round 1 | 2026-04-19 | Added location_name, location_address, end_time to spond_events. Updated Spond client, sync route, seed data, and all endpoints returning spond events. Fixed test seed to clear DBU data before insert. |
| 1 | ? | 2026-04-19 19:55 | iteration 1 |
| 2 | Round 2 | 2026-04-19 | Added scrapeTeamMatches with 1h cache, dbu_team_matches table, dbu_match_id on dbu_matches, GET /api/dbu/teams/:teamId/matches endpoint, getOpponentTeamId helper, seed data for team matches. |
