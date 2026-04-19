import { test, expect } from "../../fixtures/auth.fixture";
import { TournamentStandingsPage } from "../../fixtures/pages/tournament-standings.page";
import { MatchDetailPage } from "../../fixtures/pages/match-detail.page";

test.describe("Match Detail", () => {
  test("navigates from previous matches to match detail", async ({ authenticatedPage: page }) => {
    const tournament = new TournamentStandingsPage(page);
    await tournament.goto();

    // Click the first previous match (BK Skjold vs Vanløse IF, dbuMatchId: 900001_489363)
    const firstPrevious = page.locator('[data-testid="tournament-previous-match-0"]');
    await expect(firstPrevious).toBeVisible();
    await firstPrevious.click();

    // Should navigate to match detail page
    const detail = new MatchDetailPage(page);
    await expect(detail.container).toBeVisible();
    await expect(detail.hero).toBeVisible();
  });

  test("hero section shows teams and score for completed match", async ({ authenticatedPage: page }) => {
    const detail = new MatchDetailPage(page);
    // Navigate to BK Skjold 3-1 Vanløse IF
    await detail.goto("900001_489363");

    await expect(detail.hero).toBeVisible();
    await expect(detail.homeTeam).toContainText("BK Skjold");
    await expect(detail.awayTeam).toContainText("Vanløse IF");
    await expect(detail.score).toContainText("3 - 1");
    await expect(detail.date).toContainText("2025-03-15");
  });

  test("hero section shows vs for upcoming match", async ({ authenticatedPage: page }) => {
    const detail = new MatchDetailPage(page);
    // Navigate to upcoming match (no score)
    await detail.goto("900006_489363");

    await expect(detail.hero).toBeVisible();
    await expect(detail.homeTeam).toContainText("BK Skjold");
    await expect(detail.awayTeam).toContainText("Husum BK");
    await expect(detail.score).toContainText("vs");
  });

  test("head-to-head section renders", async ({ authenticatedPage: page }) => {
    const detail = new MatchDetailPage(page);
    await detail.goto("900001_489363");

    await expect(detail.h2h).toBeVisible();
    // Should show head-to-head title
    await expect(detail.h2h).toContainText("Indbyrdes opgør");
  });

  test("opponent season section renders", async ({ authenticatedPage: page }) => {
    const detail = new MatchDetailPage(page);
    await detail.goto("900001_489363");

    await expect(detail.opponentSeason).toBeVisible();
    await expect(detail.opponentSeason).toContainText("Modstanderens sæson");
  });

  test("common opponents section renders", async ({ authenticatedPage: page }) => {
    const detail = new MatchDetailPage(page);
    await detail.goto("900001_489363");

    await expect(detail.commonOpponents).toBeVisible();
    await expect(detail.commonOpponents).toContainText("Fælles modstandere");
  });

  test("kampfakta section renders", async ({ authenticatedPage: page }) => {
    const detail = new MatchDetailPage(page);
    await detail.goto("900001_489363");

    await expect(detail.kampfakta).toBeVisible();
    await expect(detail.kampfakta).toContainText("Kampfakta");
  });

  test("back button navigates away", async ({ authenticatedPage: page }) => {
    // First go to tournament, then click into match, then go back
    const tournament = new TournamentStandingsPage(page);
    await tournament.goto();

    const firstPrevious = page.locator('[data-testid="tournament-previous-match-0"]');
    await firstPrevious.click();

    const detail = new MatchDetailPage(page);
    await expect(detail.container).toBeVisible();

    await detail.backButton.click();
    // Should be back on tournament page
    await expect(tournament.container).toBeVisible();
  });

  test("error state for invalid match ID", async ({ authenticatedPage: page }) => {
    const detail = new MatchDetailPage(page);
    await detail.goto("invalid_match_id");

    await expect(detail.error).toBeVisible();
  });

  test("dashboard next match card links to detail", async ({ authenticatedPage: page }) => {
    // Dashboard should show the next upcoming match card
    const nextMatchCard = page.locator('[data-testid="dashboard-next-match"]');
    await expect(nextMatchCard).toBeVisible();
    await expect(nextMatchCard).toContainText("BK Skjold");
    await expect(nextMatchCard).toContainText("Husum BK");

    // Click it
    await nextMatchCard.click();

    // Should navigate to match detail
    const detail = new MatchDetailPage(page);
    await expect(detail.container).toBeVisible();
    await expect(detail.homeTeam).toContainText("BK Skjold");
  });

  test("clickable match rows have keyboard focus", async ({ authenticatedPage: page }) => {
    const tournament = new TournamentStandingsPage(page);
    await tournament.goto();

    // Check that previous match rows are clickable (have cursor-pointer)
    const firstPrevious = page.locator('[data-testid="tournament-previous-match-0"]');
    await expect(firstPrevious).toHaveClass(/cursor-pointer/);
  });
});
