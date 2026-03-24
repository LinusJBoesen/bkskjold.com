import { test, expect } from "../../fixtures/auth.fixture";

test.describe("Player Stats", () => {
  test("stats table renders with player data", async ({ authenticatedPage: page }) => {
    await page.goto("/history");
    // Should show stats for seeded players
    await expect(page.locator('[data-testid^="stat-row-"]').first()).toBeVisible();
    // Check that columns exist
    const firstRow = page.locator('[data-testid^="stat-row-"]').first();
    await expect(firstRow).toContainText(/\d+%/);
  });
});
