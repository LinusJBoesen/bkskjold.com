import { test, expect } from "../../fixtures/auth.fixture";
import { MatchAnalysisPage } from "../../fixtures/pages/match-analysis.page";

test.describe("Match Analysis", () => {
  test("analysis page renders with summary cards", async ({ authenticatedPage: page }) => {
    const analysis = new MatchAnalysisPage(page);
    await analysis.goto();

    await expect(analysis.summary).toBeVisible();
    // Should have 4 summary cards
    const cards = analysis.summary.locator("> div");
    await expect(cards).toHaveCount(4);
  });

  test("DBU matches table shows data", async ({ authenticatedPage: page }) => {
    const analysis = new MatchAnalysisPage(page);
    await analysis.goto();

    await expect(analysis.dbuMatchesTable).toBeVisible();
    const rows = analysis.dbuMatchesTable.locator("tbody tr");
    // Test data has DBU matches
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("player rates table shows data", async ({ authenticatedPage: page }) => {
    const analysis = new MatchAnalysisPage(page);
    await analysis.goto();

    await expect(analysis.playerRatesTable).toBeVisible();
    const rows = analysis.playerRatesTable.locator("tbody tr");
    // Should have at least 6 seeded players
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test("match results show win/draw/loss badges", async ({ authenticatedPage: page }) => {
    const analysis = new MatchAnalysisPage(page);
    await analysis.goto();

    // Check that result badges are visible
    const resultCells = analysis.dbuMatchesTable.locator("tbody tr td:last-child span");
    const count = await resultCells.count();
    expect(count).toBeGreaterThan(0);
  });
});
