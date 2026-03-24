import { test, expect } from "../../fixtures/auth.fixture";

test.describe("Fine Pay", () => {
  test("marking fine as paid updates status", async ({ authenticatedPage: page }) => {
    await page.goto("/fines/player-2");

    // player-2 has an unpaid 100kr fine
    const unpaidBadge = page.locator('[data-testid="fine-status-unpaid"]').first();
    await expect(unpaidBadge).toBeVisible();

    // Click "Markér betalt" on first unpaid fine
    const payButton = page.locator('button:has-text("Markér betalt")').first();
    await payButton.click();

    // The badge should change to paid
    await expect(page.locator('[data-testid="fine-status-paid"]').first()).toBeVisible();
  });
});
