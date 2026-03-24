import { type Page, type Locator } from "@playwright/test";

export class MatchAnalysisPage {
  readonly page: Page;
  readonly container: Locator;
  readonly summary: Locator;
  readonly dbuMatchesTable: Locator;
  readonly playerRatesTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="page-analysis"]');
    this.summary = page.locator('[data-testid="analysis-summary"]');
    this.dbuMatchesTable = page.locator('[data-testid="analysis-dbu-matches-table"]');
    this.playerRatesTable = page.locator('[data-testid="analysis-player-rates-table"]');
  }

  async goto() {
    await this.page.goto("/analysis");
    await this.container.waitFor();
  }
}
