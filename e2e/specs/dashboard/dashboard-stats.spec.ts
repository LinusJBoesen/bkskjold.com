import { test, expect } from "../../fixtures/auth.fixture";
import { DashboardPage } from "../../fixtures/pages/dashboard.page";

test.describe("Dashboard Stats", () => {
  test("top performers cards render", async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.top3).toBeVisible();
    // Should show 3 top-performer cards
    const cards = dashboard.top3.locator("> div");
    await expect(cards).toHaveCount(3);
  });

  test("charts are visible", async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.trainingChart).toBeVisible();
    await expect(dashboard.fineChart).toBeVisible();
  });

  test("player count is displayed", async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.playerCount).toBeVisible();
    await expect(dashboard.playerCount).not.toHaveText("0");
  });

  test("total fines displayed", async ({ authenticatedPage: page }) => {
    await expect(page.locator('[data-testid="dashboard-total-fines"]')).toBeVisible();
  });
});
