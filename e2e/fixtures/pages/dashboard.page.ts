import { type Page, type Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly container: Locator;
  readonly syncButton: Locator;
  readonly playerCount: Locator;
  readonly top3: Locator;
  readonly trainingChart: Locator;
  readonly fineChart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="page-dashboard"]');
    this.syncButton = page.locator('[data-testid="sync-button"]');
    this.playerCount = page.locator('[data-testid="player-count"]');
    this.top3 = page.locator('[data-testid="dashboard-top3"]');
    this.trainingChart = page.locator('[data-testid="dashboard-training-chart"]');
    this.fineChart = page.locator('[data-testid="dashboard-fine-chart"]');
  }
}
