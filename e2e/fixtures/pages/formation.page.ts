import { type Page, type Locator } from "@playwright/test";

export class FormationPage {
  readonly page: Page;
  readonly container: Locator;
  readonly pitch: Locator;
  readonly formationSelector: Locator;
  readonly benchArea: Locator;
  readonly playerPanel: Locator;
  readonly playerPanelSearch: Locator;
  readonly playerPanelList: Locator;
  readonly saveButton: Locator;
  readonly resetButton: Locator;
  readonly viewModeToggle: Locator;
  readonly listModeButton: Locator;
  readonly formationModeButton: Locator;
  readonly team1Button: Locator;
  readonly team2Button: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="formation-view"]');
    this.pitch = page.locator('[data-testid="pitch"]');
    this.formationSelector = page.locator('[data-testid="formation-selector"]');
    this.benchArea = page.locator('[data-testid="bench-area"]');
    this.playerPanel = page.locator('[data-testid="player-panel"]');
    this.playerPanelSearch = page.locator('[data-testid="player-panel-search"]');
    this.playerPanelList = page.locator('[data-testid="player-panel-list"]');
    this.saveButton = page.locator('[data-testid="formation-save"]');
    this.resetButton = page.locator('[data-testid="formation-reset"]');
    this.viewModeToggle = page.locator('[data-testid="view-mode-toggle"]');
    this.listModeButton = page.locator('[data-testid="view-mode-list"]');
    this.formationModeButton = page.locator('[data-testid="view-mode-formation"]');
    this.team1Button = page.locator('[data-testid="formation-team-1"]');
    this.team2Button = page.locator('[data-testid="formation-team-2"]');
  }

  formationOption(formation: string) {
    return this.page.locator(`[data-testid="formation-option-${formation}"]`);
  }

  slot(index: number) {
    return this.page.locator(`[data-testid="formation-slot-${index}"]`);
  }

  emptySlot(index: number) {
    return this.page.locator(`[data-testid="empty-slot-${index}"]`);
  }

  benchSlot(index: number) {
    return this.page.locator(`[data-testid="bench-slot-${index}"]`);
  }

  playerPanelRow(playerId: string) {
    return this.page.locator(`[data-testid="player-panel-row-${playerId}"]`);
  }
}
