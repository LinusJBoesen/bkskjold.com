import { test, expect } from "../../fixtures/auth.fixture";
import { FineDetailPage } from "../../fixtures/pages/fine-detail.page";

test.describe("Fine Create", () => {
  test("manual fine creation works", async ({ authenticatedPage: page }) => {
    await page.goto("/fines/player-1");
    const detail = new FineDetailPage(page);

    // Get initial total
    const initialText = await detail.total.textContent();
    const initialTotal = parseInt(initialText!.replace(/[^\d]/g, ""));

    // Create a new fine
    await detail.createFine("missing_training", "30", "Test bøde");

    // Wait for the form to close and data to refresh
    await expect(detail.createForm).not.toBeVisible();

    // Total should have increased
    await expect(detail.total).not.toHaveText(`${initialTotal} kr`);
  });
});
