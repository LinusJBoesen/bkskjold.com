import { test, expect } from "../../fixtures/auth.fixture";
import { AdminPage } from "../../fixtures/pages/admin.page";

test.describe("Player Position Admin", () => {
  test("positions tab is visible in admin", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await expect(admin.positionsTab).toBeVisible();
  });

  test("positions tab shows table with position columns", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.positionsTab.click();
    await expect(admin.positionsSection).toBeVisible();

    // Should show position column headers
    await expect(admin.positionsSection.locator("thead")).toBeVisible();
    await expect(admin.positionsSection.locator("th", { hasText: "Spiller" })).toBeVisible();
    await expect(admin.positionsSection.locator("th", { hasText: "Målmand" })).toBeVisible();
    await expect(admin.positionsSection.locator("th", { hasText: "Forsvar" })).toBeVisible();
    await expect(admin.positionsSection.locator("th", { hasText: "Kant" })).toBeVisible();
    await expect(admin.positionsSection.locator("th", { hasText: "Central" })).toBeVisible();
    await expect(admin.positionsSection.locator("th", { hasText: "Angriber" })).toBeVisible();
  });

  test("switching to positions tab and back works", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();

    // Click positions tab
    await admin.positionsTab.click();
    await expect(admin.positionsSection).toBeVisible();

    // Switch back to config tab
    await admin.configTab.click();
    await expect(admin.configSection).toBeVisible();

    // Switch to positions again
    await admin.positionsTab.click();
    await expect(admin.positionsSection).toBeVisible();
  });
});
