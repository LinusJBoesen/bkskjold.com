import { type Page, type Locator } from "@playwright/test";

export class TrainingHistoryPage {
  readonly page: Page;
  readonly container: Locator;
  readonly pendingMatches: Locator;
  readonly matchList: Locator;
  readonly exportButton: Locator;
  readonly filter: Locator;
  readonly sort: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="page-history"]');
    this.pendingMatches = page.locator('[data-testid="history-pending-matches"]');
    this.matchList = page.locator('[data-testid="history-match-list"]');
    this.exportButton = page.locator('[data-testid="history-export-csv"]');
    this.filter = page.locator('[data-testid="history-filter"]');
    this.sort = page.locator('[data-testid="history-sort"]');
  }

  async goto() {
    await this.page.goto("/history");
  }
}
