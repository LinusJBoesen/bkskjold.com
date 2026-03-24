import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { testCredentials } from "./test-data";

type AuthFixtures = {
  authenticatedPage: Page;
  loginPage: LoginPage;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Seed test data before each test
    await page.request.post("http://localhost:3000/api/test/seed");

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testCredentials.email, testCredentials.password);
    await page.waitForURL("/dashboard");
    await use(page);
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

export { expect } from "@playwright/test";
