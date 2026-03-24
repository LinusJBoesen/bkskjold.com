import { test, expect } from "../../fixtures/auth.fixture";
import { TeamSelectorPage } from "../../fixtures/pages/team-selector.page";

test.describe("Team Save", () => {
  test("saving teams creates a pending match", async ({ authenticatedPage: page }) => {
    const teamPage = new TeamSelectorPage(page);
    await page.goto("/teams");
    await teamPage.generateButton.click();
    await expect(teamPage.saveButton).toBeVisible();
    await teamPage.saveButton.click();
    await expect(teamPage.saveButton).toHaveText("Gemt!");
  });
});
