import { type Page, type Locator } from "@playwright/test";

export class TeamSelectorPage {
  readonly page: Page;
  readonly container: Locator;
  readonly availablePlayers: Locator;
  readonly generateButton: Locator;
  readonly guestInput: Locator;
  readonly addGuestButton: Locator;
  readonly team1Players: Locator;
  readonly team2Players: Locator;
  readonly balance: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="page-teams"]');
    this.availablePlayers = page.locator('[data-testid="team-available-players"]');
    this.generateButton = page.locator('[data-testid="team-generate-button"]');
    this.guestInput = page.locator('[data-testid="team-guest-input"]');
    this.addGuestButton = page.locator('[data-testid="team-add-guest"]');
    this.team1Players = page.locator('[data-testid="team-1-players"]');
    this.team2Players = page.locator('[data-testid="team-2-players"]');
    this.balance = page.locator('[data-testid="team-balance"]');
    this.saveButton = page.locator('[data-testid="team-save-button"]');
  }

  async goto() {
    await this.page.goto("/teams");
  }
}
