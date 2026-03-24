import { test, expect } from "../../fixtures/auth.fixture";

test.describe("Pending Matches", () => {
  test("pending match shows with result buttons", async ({ authenticatedPage: page }) => {
    await page.goto("/history");
    // Seeded data has match-1 as pending
    const pending = page.locator('[data-testid="history-pending-matches"]');
    await expect(pending).toBeVisible();
    await expect(page.locator('[data-testid^="result-team1-"]').first()).toBeVisible();
    await expect(page.locator('[data-testid^="result-team2-"]').first()).toBeVisible();
  });

  test("registering result moves match to completed", async ({ authenticatedPage: page }) => {
    await page.goto("/history");
    // Click "Hold 1 Vandt" on the first pending match
    await page.locator('[data-testid^="result-team1-"]').first().click();
    // Should now show in completed matches
    await expect(page.locator('[data-testid="history-match-list"]')).toBeVisible();
    await expect(page.locator('[data-testid^="completed-match-"]').first()).toBeVisible();
  });
});
