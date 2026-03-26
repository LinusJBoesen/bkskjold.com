import { test, expect } from "@playwright/test";

test.describe("Role-based access", () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post("http://localhost:3000/api/test/seed");
  });

  test("fan cannot access fines page (redirect)", async ({ page }) => {
    const email = `fan-role-${Date.now()}@test.dk`;

    // Register as fan
    await page.request.post("http://localhost:3000/api/auth/register", {
      data: { name: "Role Fan", email, password: "test1234", role: "fan" },
    });

    // Login
    await page.goto("/login");
    await page.locator('[data-testid="login-email"]').fill(email);
    await page.locator('[data-testid="login-password"]').fill("test1234");
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL("/dashboard");

    // Try to access fines — should redirect to dashboard
    await page.goto("/fines");
    await page.waitForURL("/dashboard");
    await expect(page.locator('[data-testid="page-dashboard"]')).toBeVisible();

    // Try to access teams — should redirect to dashboard
    await page.goto("/teams");
    await page.waitForURL("/dashboard");

    // Try to access admin — should redirect to dashboard
    await page.goto("/admin");
    await page.waitForURL("/dashboard");
  });

  test("admin has full access", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.locator('[data-testid="login-email"]').fill("admin@bkskjold.dk");
    await page.locator('[data-testid="login-password"]').fill("test1234");
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL("/dashboard");

    // Admin should see all sidebar items
    await expect(page.locator('[data-testid="nav-fines"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-teams"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-admin"]')).toBeVisible();

    // Role badge should show Admin
    await expect(page.locator('[data-testid="header-role-badge"]')).toContainText("Admin");
  });
});
