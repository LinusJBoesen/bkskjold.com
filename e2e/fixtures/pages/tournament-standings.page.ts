import { type Page, type Locator } from "@playwright/test";

export class TournamentStandingsPage {
  readonly page: Page;
  readonly container: Locator;
  readonly table: Locator;
  readonly refreshButton: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="page-tournament"]');
    this.table = page.locator('[data-testid="tournament-standings-table"]');
    this.refreshButton = page.locator('[data-testid="tournament-refresh-button"]');
    this.rows = this.table.locator("tbody tr");
  }

  async goto() {
    await this.page.goto("/tournament");
    await this.container.waitFor();
  }

  getRow(position: number) {
    return this.page.locator(`[data-testid="tournament-row-${position}"]`);
  }
}
