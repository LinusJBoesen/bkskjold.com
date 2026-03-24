import { test, expect } from "../../fixtures/auth.fixture";
import { FineDetailPage } from "../../fixtures/pages/fine-detail.page";

test.describe("Fine Detail", () => {
  test("shows player fine history", async ({ authenticatedPage: page }) => {
    await page.goto("/fines/player-1");
    const detail = new FineDetailPage(page);
    await expect(detail.container).toBeVisible();
    await expect(detail.total).toBeVisible();
    // player-1 has fines, total should be > 0
    const text = await detail.total.textContent();
    const amount = parseInt(text!.replace(/[^\d]/g, ""));
    expect(amount).toBeGreaterThan(0);
  });

  test("shows fine status badges", async ({ authenticatedPage: page }) => {
    await page.goto("/fines/player-1");
    // player-1 has both paid and unpaid fines
    await expect(page.locator('[data-testid="fine-status-unpaid"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="fine-status-paid"]').first()).toBeVisible();
  });
});
