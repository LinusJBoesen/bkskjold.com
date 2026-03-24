import { test, expect } from "../../fixtures/auth.fixture";
import { FineOverviewPage } from "../../fixtures/pages/fine-overview.page";

test.describe("Fine Overview", () => {
  test("shows fine overview table with player data", async ({ authenticatedPage: page }) => {
    await page.goto("/fines");
    const overview = new FineOverviewPage(page);
    await expect(overview.heading).toHaveText("Bødeoversigt");
    await expect(overview.table).toBeVisible();
    await expect(overview.totalUnpaid).toBeVisible();
    await expect(overview.totalPaid).toBeVisible();
  });

  test("shows players with fine summaries", async ({ authenticatedPage: page }) => {
    await page.goto("/fines");
    const overview = new FineOverviewPage(page);
    // Seeded data has fines for player-1, player-2, player-3
    await expect(overview.playerRow("player-1")).toBeVisible();
  });

  test("clicking player navigates to detail", async ({ authenticatedPage: page }) => {
    await page.goto("/fines");
    const overview = new FineOverviewPage(page);
    await overview.clickPlayer("player-1");
    await expect(page.locator('[data-testid="page-fine-detail"]')).toBeVisible();
  });
});
