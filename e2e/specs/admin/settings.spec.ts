import { test, expect } from "../../fixtures/auth.fixture";
import { AdminPage } from "../../fixtures/pages/admin.page";

test.describe("Admin Settings", () => {
  test("shows admin page with tabs", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await expect(admin.heading).toHaveText("Admin");
    await expect(admin.tabs).toBeVisible();
    await expect(admin.configTab).toBeVisible();
    await expect(admin.fineTypesTab).toBeVisible();
    await expect(admin.dataTab).toBeVisible();
  });

  test("config tab shows editable config values", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await expect(admin.configSection).toBeVisible();
    // Seeded config values should be present and editable
    await expect(admin.configInput("late_response_hours")).toBeVisible();
    await expect(admin.configInput("fine_missing_match")).toBeVisible();
  });

  test("can update a config value", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    const input = admin.configInput("late_response_hours");
    await input.clear();
    await input.fill("48");
    await admin.configSaveBtn("late_response_hours").click();
    // Should show saved confirmation
    await expect(page.getByText("Konfiguration gemt")).toBeVisible();
  });

  test("switching tabs shows correct content", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();

    // Click fine types tab
    await admin.fineTypesTab.click();
    await expect(admin.fineTypesSection).toBeVisible();

    // Click data tab
    await admin.dataTab.click();
    await expect(admin.dataSection).toBeVisible();

    // Click config tab
    await admin.configTab.click();
    await expect(admin.configSection).toBeVisible();
  });

  test("data tab shows export and import buttons", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.dataTab.click();
    await expect(admin.exportBtn).toBeVisible();
    await expect(admin.importBtn).toBeVisible();
  });
});
