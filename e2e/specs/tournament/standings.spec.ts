import { test, expect } from "../../fixtures/auth.fixture";
import { TournamentStandingsPage } from "../../fixtures/pages/tournament-standings.page";

test.describe("Tournament Standings", () => {
  test("standings table renders with seeded data", async ({ authenticatedPage: page }) => {
    const tournament = new TournamentStandingsPage(page);
    await tournament.goto();

    await expect(tournament.table).toBeVisible();
    await expect(tournament.rows).toHaveCount(10);
  });

  test("BK Skjold row is highlighted", async ({ authenticatedPage: page }) => {
    const tournament = new TournamentStandingsPage(page);
    await tournament.goto();

    const skjoldRow = tournament.getRow(2);
    await expect(skjoldRow).toBeVisible();
    await expect(skjoldRow).toContainText("BK Skjold");
  });

  test("top positions have green color coding", async ({ authenticatedPage: page }) => {
    const tournament = new TournamentStandingsPage(page);
    await tournament.goto();

    const row1 = tournament.getRow(1);
    await expect(row1).toHaveClass(/border-l-accent-green/);
  });

  test("bottom positions have red color coding", async ({ authenticatedPage: page }) => {
    const tournament = new TournamentStandingsPage(page);
    await tournament.goto();

    const row10 = tournament.getRow(10);
    await expect(row10).toHaveClass(/border-l-brand-red/);
  });

  test("refresh button works", async ({ authenticatedPage: page }) => {
    const tournament = new TournamentStandingsPage(page);
    await tournament.goto();

    await expect(tournament.refreshButton).toBeVisible();
    await tournament.refreshButton.click();

    // Should still show standings after refresh
    await expect(tournament.rows).toHaveCount(10);
  });
});
