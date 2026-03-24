import { test, expect } from "../../fixtures/auth.fixture";
import { testCredentials, invalidCredentials } from "../../fixtures/test-data";
import { LoginPage } from "../../fixtures/pages/login.page";

test.describe("Login", () => {
  test("shows login form with Danish labels", async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.form).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toHaveText("Log ind");
  });

  test("valid login redirects to dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testCredentials.email, testCredentials.password);
    await page.waitForURL("/dashboard");
    await expect(page.locator('[data-testid="page-dashboard"]')).toBeVisible();
  });

  test("invalid login shows error", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(invalidCredentials.email, invalidCredentials.password);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/login");
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });
});
