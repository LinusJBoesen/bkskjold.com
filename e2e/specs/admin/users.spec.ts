import { test, expect } from "../../fixtures/auth.fixture";

test.describe("Admin Users", () => {
  test("admin sees pending users and can approve", async ({ authenticatedPage: page }) => {
    const email = `pending-${Date.now()}@test.dk`;

    // Register a spiller (will be pending)
    await page.request.post("http://localhost:3000/api/auth/register", {
      data: { name: "Pending Spiller", email, password: "test1234", role: "spiller" },
    });

    // Navigate to admin users tab
    await page.goto("/admin");
    await page.locator('[data-testid="admin-tab-users"]').click();
    await expect(page.locator('[data-testid="admin-users-section"]')).toBeVisible();

    // Should see pending user
    await expect(page.locator('[data-testid="admin-users-pending-count"]')).toBeVisible();

    // Approve the user
    const pendingRow = page.locator(`text=Pending Spiller`).first();
    await expect(pendingRow).toBeVisible();

    // Find and click the approve button for this user
    const approveButtons = page.locator('[data-testid^="admin-user-approve-"]');
    await approveButtons.first().click();

    // Now the user should be able to login — verify by checking API
    const loginResponse = await page.request.post("http://localhost:3000/api/auth/login", {
      data: { email, password: "test1234" },
    });
    expect(loginResponse.ok()).toBeTruthy();
  });

  test("admin users tab shows user list", async ({ authenticatedPage: page }) => {
    await page.goto("/admin");
    await page.locator('[data-testid="admin-tab-users"]').click();
    await expect(page.locator('[data-testid="admin-users-section"]')).toBeVisible();

    // Should show the admin user at minimum
    const userRows = page.locator('[data-testid^="admin-user-row-"]');
    await expect(userRows.first()).toBeVisible();
  });
});
