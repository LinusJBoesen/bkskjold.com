import { test, expect } from "../../fixtures/auth.fixture";

test.describe("Navigation", () => {
  test("sidebar shows all nav items in Danish", async ({ authenticatedPage: page }) => {
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-dashboard"]')).toHaveText("Oversigt");
    await expect(page.locator('[data-testid="nav-fines"]')).toHaveText("Bødeoversigt");
    await expect(page.locator('[data-testid="nav-teams"]')).toHaveText("Hold Udvælger");
    await expect(page.locator('[data-testid="nav-history"]')).toHaveText("Træningshistorik");
    await expect(page.locator('[data-testid="nav-tournament"]')).toHaveText("Turnering");
    await expect(page.locator('[data-testid="nav-analysis"]')).toHaveText("Kampanalyse");
    await expect(page.locator('[data-testid="nav-admin"]')).toHaveText("Admin");
  });

  test("clicking nav items navigates to correct pages", async ({ authenticatedPage: page }) => {
    await page.locator('[data-testid="nav-fines"]').click();
    await expect(page.locator('[data-testid="page-fines"]')).toBeVisible();

    await page.locator('[data-testid="nav-teams"]').click();
    await expect(page.locator('[data-testid="page-teams"]')).toBeVisible();

    await page.locator('[data-testid="nav-history"]').click();
    await expect(page.locator('[data-testid="page-history"]')).toBeVisible();

    await page.locator('[data-testid="nav-tournament"]').click();
    await expect(page.locator('[data-testid="page-tournament"]')).toBeVisible();

    await page.locator('[data-testid="nav-analysis"]').click();
    await expect(page.locator('[data-testid="page-analysis"]')).toBeVisible();

    await page.locator('[data-testid="nav-admin"]').click();
    await expect(page.locator('[data-testid="page-admin"]')).toBeVisible();

    await page.locator('[data-testid="nav-dashboard"]').click();
    await expect(page.locator('[data-testid="page-dashboard"]')).toBeVisible();
  });

  test("header shows logout button", async ({ authenticatedPage: page }) => {
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="header-logout"]')).toHaveText("Log ud");
  });

  test("logout redirects to login", async ({ authenticatedPage: page }) => {
    await page.locator('[data-testid="header-logout"]').click();
    await page.waitForURL("/login");
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });
});
