import { type Page, type Locator } from "@playwright/test";

export class FineOverviewPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly table: Locator;
  readonly totalUnpaid: Locator;
  readonly totalPaid: Locator;
  readonly playerCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('[data-testid="page-fines"] h1');
    this.table = page.locator("table");
    this.totalUnpaid = page.locator('[data-testid="fine-total-unpaid"]');
    this.totalPaid = page.locator('[data-testid="fine-total-paid"]');
    this.playerCount = page.locator('[data-testid="fine-player-count"]');
  }

  async goto() {
    await this.page.goto("/fines");
  }

  playerRow(playerId: string) {
    return this.page.locator(`[data-testid="fine-player-row-${playerId}"]`);
  }

  async clickPlayer(playerId: string) {
    await this.playerRow(playerId).click();
  }
}
