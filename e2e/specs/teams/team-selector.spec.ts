import { test, expect } from "../../fixtures/auth.fixture";
import { TeamSelectorPage } from "../../fixtures/pages/team-selector.page";

test.describe("Team Selector", () => {
  test("player list loads with available players", async ({ authenticatedPage: page }) => {
    const teamPage = new TeamSelectorPage(page);
    await page.goto("/teams");
    await expect(teamPage.availablePlayers).toBeVisible();
    await expect(teamPage.generateButton).toBeVisible();
    // Should have seeded players
    const checkboxes = teamPage.availablePlayers.locator("input[type=checkbox]");
    await expect(checkboxes).not.toHaveCount(0);
  });

  test("team generation produces two teams", async ({ authenticatedPage: page }) => {
    const teamPage = new TeamSelectorPage(page);
    await page.goto("/teams");
    await teamPage.generateButton.click();
    await expect(teamPage.team1Players).toBeVisible();
    await expect(teamPage.team2Players).toBeVisible();
    await expect(teamPage.balance).toBeVisible();
  });
});
