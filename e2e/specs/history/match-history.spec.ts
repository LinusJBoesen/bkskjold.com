import { test, expect } from "../../fixtures/auth.fixture";
import { TrainingHistoryPage } from "../../fixtures/pages/training-history.page";

test.describe("Match History", () => {
  test("history list with filter and sort controls", async ({ authenticatedPage: page }) => {
    const historyPage = new TrainingHistoryPage(page);
    await historyPage.goto();
    await expect(historyPage.matchList).toBeVisible();
    await expect(historyPage.filter).toBeVisible();
    await expect(historyPage.sort).toBeVisible();
    await expect(historyPage.exportButton).toBeVisible();
  });
});
