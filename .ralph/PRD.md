# Skjold Bode GitHub Issues Batch — PRD

## Goal

Fix and implement features from GitHub issues #3, #4, #5, #6, #7, #9, #10, #11, #12. Covers quick UI fixes, match data improvements, training match management, kampanalyse upgrades, turnering enhancements, and fan signup.

---

## Rounds

### Round 1: Quick Fixes (#9, #10)

**Issue #9 — Default mail should not be admin:**
- [ ] Change the placeholder/default email on the login page from any bkskjold-specific email to a generic example like `email@example.com`
- [ ] Ensure the login page still works correctly

**Issue #10 — Add MobilePay link in Bødeoversigt:**
- [ ] Add a clickable MobilePay payment link to the fines overview page: `https://qr.mobilepay.dk/box/ed7689f5-3718-4168-ad64-bdf9081d0fda/pay-in`
- [ ] Style it as a prominent button or link so users can easily pay their fines
- [ ] Add appropriate i18n string in `da.ts`

- [ ] Run E2E tests — all pass
- [ ] Commit: `fix(skjold): generic login placeholder email, MobilePay payment link in fines overview`

### Round 2: Post Match Card (#7)

**Issue #7 — Tilføj post match card:**
- [ ] Add ability to mark a match as "completed" (afsluttet)
- [ ] Create a post-match data entry form/card where admin can record:
  - Final score (hjemme/ude)
  - Goal scorers (which players scored, how many)
  - Assists (which players assisted)
  - Yellow cards
  - Red cards
- [ ] Store match events in database (goals, assists, cards per player per match)
- [ ] Add `match_events` table if needed:
  ```sql
  CREATE TABLE IF NOT EXISTS match_events (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id),
    event_type TEXT NOT NULL CHECK(event_type IN ('goal','assist','yellow_card','red_card','clean_sheet')),
    minute INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
  ```
- [ ] API endpoints:
  - `POST /api/matches/:id/events` — add match events (admin only)
  - `GET /api/matches/:id/events` — get events for a match
  - `PATCH /api/matches/:id/complete` — mark match as completed with result + events
- [ ] Frontend: post-match card UI accessible from match list, styled with existing dark theme
- [ ] Add i18n strings for all new UI text
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): post match card with goals, assists, cards tracking`

### Round 3: Kampanalyse Upgrade (#6)

**Issue #6 — Kampanalyse:**
- [ ] Remove træningshistorik from the kampanalyse/analysis page (or separate it clearly)
- [ ] Add clean sheet tracking to match analysis
- [ ] Add yellow card and red card statistics to match analysis
- [ ] Update the analysis page to show per-player:
  - Goals scored
  - Assists
  - Clean sheets (for goalkeepers/defenders or whole team)
  - Yellow cards
  - Red cards
- [ ] Use data from match_events table (from Round 2)
- [ ] Update i18n strings
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): kampanalyse with clean sheets, yellow/red cards, no training history`

### Round 4: Training Matches — Delete + Player View (#3, #4)

**Issue #3 — Admin can delete training matches:**
- [ ] Add delete button/action for training match lineups
- [ ] Backend: `DELETE /api/teams/history/:id` or similar endpoint (admin only)
- [ ] Add confirmation dialog before deletion
- [ ] Admin can re-generate teams after deleting

**Issue #4 — Training match player (spiller) view:**
- [ ] Players (rolle=spiller) can see saved training lineups
- [ ] Read-only view of team compositions for upcoming/recent trainings
- [ ] Accessible from sidebar or training section
- [ ] Only shows team composition, no edit capabilities for spillere

- [ ] Add i18n strings
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): delete training matches, player view of team lineups`

### Round 5: Fix Spillerpositioner (#5)

**Issue #5 — Spillerpositioner admin:**
- [ ] Diagnose why "Ingen spillere fundet" appears — players are not being fetched for position assignment
- [ ] Fix the player fetching logic so admin can assign positions
- [ ] Ensure Spond sync populates players correctly for this feature
- [ ] If no Spond data available, gracefully handle by showing existing DB players

- [ ] Run E2E tests — all pass
- [ ] Commit: `fix(skjold): player positions admin - fix player fetching for position assignment`

### Round 6: Turnering — Upcoming & Previous Matches (#12)

**Issue #12 — Add upcoming and previous matches to Turnering:**
- [ ] Show upcoming matches with date, opponent, time/location
- [ ] Show previous match results (score, date, opponent)
- [ ] Data source: either from DBU scraper or manual match entries
- [ ] Split the turnering page into sections: Stilling (existing), Kommende kampe, Tidligere kampe
- [ ] Add i18n strings

- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): turnering with upcoming matches and previous results`

### Round 7: Fan Sign-up Form (#11)

**Issue #11 — Sign up button for fans:**
- [ ] Add a fan sign-up / interest form accessible from landing page or fan section
- [ ] Form fields:
  - Position (which position they play)
  - Comment (free text)
  - "Love for BK Skjold" (fun field — scale or text)
- [ ] Store submissions in database (new `fan_signups` table)
- [ ] Backend: `POST /api/fan-signup` (public or fan-authenticated)
- [ ] Admin can view submitted fan sign-ups in admin panel
- [ ] Add i18n strings

- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): fan signup form with position, comment, and team love`

---

## Technical Notes

- All UI text in Danish via `frontend/src/i18n/da.ts`
- Follow existing dark theme (zinc-950, zinc-900/50, red #D42428)
- Use `data-testid` on all new interactive elements
- Do not break existing E2E tests
- Respect role-based access: admin for mutations, spiller for read, fan for limited access

## Success Criteria

1. All 9 GitHub issues addressed
2. All existing E2E tests still pass
3. New features follow existing code conventions
4. UI is responsive and in Danish
5. Role-based access respected on all new features
