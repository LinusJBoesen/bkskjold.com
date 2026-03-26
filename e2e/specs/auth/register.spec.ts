import { test, expect } from "@playwright/test";

test.describe("Registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post("http://localhost:3000/api/test/seed");
  });

  test("fan registration → login → see limited sidebar", async ({ page }) => {
    const email = `fan-${Date.now()}@test.dk`;

    // Navigate to register page
    await page.goto("/register");
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();

    // Fill form — fan is default
    await page.locator('[data-testid="register-name"]').fill("Test Fan");
    await page.locator('[data-testid="register-email"]').fill(email);
    await page.locator('[data-testid="register-password"]').fill("test1234");
    await page.locator('[data-testid="register-role-fan"]').click();
    await page.locator('[data-testid="register-submit"]').click();

    // Should see success message for fan
    await expect(page.locator('[data-testid="register-success-message"]')).toContainText("logge ind");

    // Login as the fan
    await page.locator('[data-testid="register-login-link"]').click();
    await page.waitForURL("/login");
    await page.locator('[data-testid="login-email"]').fill(email);
    await page.locator('[data-testid="login-password"]').fill("test1234");
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL("/dashboard");

    // Fan should see limited sidebar — no fines, teams, history, admin
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-tournament"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-analysis"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-fines"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-teams"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible();

    // Role badge should show Fan
    await expect(page.locator('[data-testid="header-role-badge"]')).toContainText("Fan");
  });

  test("spiller registration → pending message → cannot login", async ({ page }) => {
    const email = `spiller-${Date.now()}@test.dk`;

    await page.goto("/register");
    await page.locator('[data-testid="register-name"]').fill("Test Spiller");
    await page.locator('[data-testid="register-email"]').fill(email);
    await page.locator('[data-testid="register-password"]').fill("test1234");
    await page.locator('[data-testid="register-role-spiller"]').click();

    // Spond email field should be visible
    await expect(page.locator('[data-testid="register-spond-section"]')).toBeVisible();

    await page.locator('[data-testid="register-submit"]').click();

    // Should see pending approval message
    await expect(page.locator('[data-testid="register-success-message"]')).toContainText("godkendelse");

    // Try to login — should fail
    await page.goto("/login");
    await page.locator('[data-testid="login-email"]').fill(email);
    await page.locator('[data-testid="login-password"]').fill("test1234");
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test("duplicate email shows error", async ({ page }) => {
    const email = `dup-${Date.now()}@test.dk`;

    // Register first time
    await page.goto("/register");
    await page.locator('[data-testid="register-name"]').fill("First User");
    await page.locator('[data-testid="register-email"]').fill(email);
    await page.locator('[data-testid="register-password"]').fill("test1234");
    await page.locator('[data-testid="register-submit"]').click();
    await expect(page.locator('[data-testid="register-success-message"]')).toBeVisible();

    // Register again with same email
    await page.goto("/register");
    await page.locator('[data-testid="register-name"]').fill("Second User");
    await page.locator('[data-testid="register-email"]').fill(email);
    await page.locator('[data-testid="register-password"]').fill("test1234");
    await page.locator('[data-testid="register-submit"]').click();

    // Should see error
    await expect(page.locator('[data-testid="register-error"]')).toBeVisible();
  });

  test("login page has register link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('[data-testid="login-register-link"]')).toBeVisible();
    await page.locator('[data-testid="login-register-link"]').click();
    await page.waitForURL("/register");
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
  });
});
