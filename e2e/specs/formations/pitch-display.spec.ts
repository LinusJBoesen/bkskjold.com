import { test, expect } from "../../fixtures/auth.fixture";
import { TeamSelectorPage } from "../../fixtures/pages/team-selector.page";
import { FormationPage } from "../../fixtures/pages/formation.page";

test.describe("Formation Pitch Display", () => {
  async function generateAndSwitchToFormation(page: any) {
    const teamPage = new TeamSelectorPage(page);
    await page.goto("/teams");
    await teamPage.generateButton.click();
    await expect(teamPage.team1Players).toBeVisible();

    const formation = new FormationPage(page);
    await formation.formationModeButton.click();
    return formation;
  }

  test("formation view appears after generating teams", async ({ authenticatedPage: page }) => {
    const formation = await generateAndSwitchToFormation(page);
    await expect(formation.container).toBeVisible();
    await expect(formation.pitch).toBeVisible();
    await expect(formation.benchArea).toBeVisible();
    await expect(formation.playerPanel).toBeVisible();
  });

  test("pitch shows 7 formation slots", async ({ authenticatedPage: page }) => {
    const formation = await generateAndSwitchToFormation(page);
    // Default formation 1-2-3-1 has 7 slots (indices 0-6)
    for (let i = 0; i < 7; i++) {
      await expect(formation.slot(i)).toBeVisible();
    }
  });

  test("formation selector shows all three formations", async ({ authenticatedPage: page }) => {
    const formation = await generateAndSwitchToFormation(page);
    await expect(formation.formationOption("1-2-3-1")).toBeVisible();
    await expect(formation.formationOption("1-3-2-1")).toBeVisible();
    await expect(formation.formationOption("1-3-3")).toBeVisible();
  });

  test("switching formation re-renders slots", async ({ authenticatedPage: page }) => {
    const formation = await generateAndSwitchToFormation(page);

    // Switch to 1-3-2-1
    await formation.formationOption("1-3-2-1").click();
    // Slots should still be visible after switch
    for (let i = 0; i < 7; i++) {
      await expect(formation.slot(i)).toBeVisible();
    }
  });

  test("bench area shows 3 bench slots", async ({ authenticatedPage: page }) => {
    const formation = await generateAndSwitchToFormation(page);
    for (let i = 0; i < 3; i++) {
      await expect(formation.benchSlot(i)).toBeVisible();
    }
  });

  test("can switch between team 1 and team 2", async ({ authenticatedPage: page }) => {
    const formation = await generateAndSwitchToFormation(page);
    await expect(formation.team1Button).toBeVisible();
    await expect(formation.team2Button).toBeVisible();

    // Switch to team 2
    await formation.team2Button.click();
    await expect(formation.pitch).toBeVisible();
  });

  test("can switch back to list view", async ({ authenticatedPage: page }) => {
    const teamPage = new TeamSelectorPage(page);
    const formation = await generateAndSwitchToFormation(page);
    await expect(formation.container).toBeVisible();

    // Switch back to list
    await formation.listModeButton.click();
    await expect(teamPage.team1Players).toBeVisible();
    await expect(teamPage.team2Players).toBeVisible();
  });
});
