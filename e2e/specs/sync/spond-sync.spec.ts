import { test, expect } from "../../fixtures/auth.fixture";

test.describe("Spond Sync", () => {
  test("sync button is visible on dashboard", async ({ authenticatedPage: page }) => {
    await expect(page.locator('[data-testid="sync-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-button"]')).toHaveText("Synkronisér Data");
  });

  test("clicking sync shows feedback message", async ({ authenticatedPage: page }) => {
    await page.locator('[data-testid="sync-button"]').click();
    // Sync result shown via toast notification
    await expect(page.locator('[data-testid="toast-message"]')).toBeVisible({ timeout: 10_000 });
  });

  test("player count is displayed", async ({ authenticatedPage: page }) => {
    const count = page.locator('[data-testid="player-count"]');
    await expect(count).toBeVisible();
    // Should have seeded players
    await expect(count).not.toHaveText("0");
  });
});
