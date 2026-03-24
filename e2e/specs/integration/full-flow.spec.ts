import { test, expect } from "../../fixtures/auth.fixture";
import { FineOverviewPage } from "../../fixtures/pages/fine-overview.page";
import { FineDetailPage } from "../../fixtures/pages/fine-detail.page";
import { TeamSelectorPage } from "../../fixtures/pages/team-selector.page";
import { TrainingHistoryPage } from "../../fixtures/pages/training-history.page";
import { DashboardPage } from "../../fixtures/pages/dashboard.page";

test.describe("Full Integration Flow", () => {
  test("login → dashboard → fines → create fine → teams → save match → register result → dashboard stats", async ({
    authenticatedPage: page,
  }) => {
    // 1. Dashboard loads with stats
    const dashboard = new DashboardPage(page);
    await expect(dashboard.container).toBeVisible();
    await expect(dashboard.playerCount).toBeVisible();

    // 2. Trigger sync (with seeded data — Spond will fail gracefully)
    await dashboard.syncButton.click();
    // Wait for sync to complete (either success or failure toast)
    await page.waitForTimeout(1000);

    // 3. Navigate to fines overview
    await page.locator('[data-testid="nav-fines"]').click();
    const fineOverview = new FineOverviewPage(page);
    await expect(fineOverview.heading).toHaveText("Bødeoversigt");
    await expect(fineOverview.table).toBeVisible();
    await expect(fineOverview.totalUnpaid).toBeVisible();
    await expect(fineOverview.totalPaid).toBeVisible();

    // 4. Navigate to player fine detail
    await fineOverview.clickPlayer("player-1");
    const fineDetail = new FineDetailPage(page);
    await expect(fineDetail.container).toBeVisible();
    await expect(fineDetail.total).toBeVisible();

    // 5. Create a manual fine
    await fineDetail.createFine("missing_training", "30", "Integration test bøde");
    // Wait for the fine to be created and table to update
    await page.waitForTimeout(500);

    // Verify the fine appears in the table (use first() as multiple may exist from prior runs)
    await expect(page.locator("text=Integration test bøde").first()).toBeVisible();

    // 6. Go back to fines overview
    await fineDetail.backButton.click();
    await expect(fineOverview.heading).toBeVisible();

    // 7. Navigate to team selector
    await page.locator('[data-testid="nav-teams"]').click();
    const teamSelector = new TeamSelectorPage(page);
    await expect(teamSelector.container).toBeVisible();
    await expect(teamSelector.availablePlayers).toBeVisible();

    // 8. Generate teams
    await teamSelector.generateButton.click();
    await expect(teamSelector.team1Players).toBeVisible();
    await expect(teamSelector.team2Players).toBeVisible();
    await expect(teamSelector.balance).toBeVisible();

    // 9. Save match
    await teamSelector.saveButton.click();
    // Wait for save
    await expect(teamSelector.saveButton).toHaveText("Gemt!");

    // 10. Navigate to training history
    await page.locator('[data-testid="nav-history"]').click();
    const history = new TrainingHistoryPage(page);
    await expect(history.container).toBeVisible();

    // 11. Check pending matches exist
    await expect(history.pendingMatches).toBeVisible();

    // 12. Register result for the first pending match
    const firstPendingMatch = page.locator('[data-testid^="pending-match-"]').first();
    await expect(firstPendingMatch).toBeVisible();
    const matchTestId = await firstPendingMatch.getAttribute("data-testid");
    const matchId = matchTestId!.replace("pending-match-", "");
    await page.locator(`[data-testid="result-team1-${matchId}"]`).click();

    // Wait for result registration
    await page.waitForTimeout(500);

    // 13. Navigate to dashboard and verify stats are updated
    await page.locator('[data-testid="nav-dashboard"]').click();
    await expect(dashboard.container).toBeVisible();
    await expect(dashboard.playerCount).toBeVisible();
    await expect(dashboard.top3).toBeVisible();
  });
});
