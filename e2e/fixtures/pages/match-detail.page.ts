import { type Page, type Locator } from "@playwright/test";

export class MatchDetailPage {
  readonly page: Page;
  readonly container: Locator;
  readonly backButton: Locator;
  readonly hero: Locator;
  readonly homeTeam: Locator;
  readonly awayTeam: Locator;
  readonly score: Locator;
  readonly date: Locator;
  readonly venue: Locator;
  readonly mapsLink: Locator;
  readonly h2h: Locator;
  readonly h2hRows: Locator;
  readonly opponentSeason: Locator;
  readonly commonOpponents: Locator;
  readonly commonRows: Locator;
  readonly kampfakta: Locator;
  readonly referee: Locator;
  readonly pitch: Locator;
  readonly scorers: Locator;
  readonly lineupHomeToggle: Locator;
  readonly lineupAwayToggle: Locator;
  readonly error: Locator;
  readonly skeletonHero: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="match-detail-page"]');
    this.backButton = page.locator('[data-testid="match-detail-back"]');
    this.hero = page.locator('[data-testid="match-detail-hero"]');
    this.homeTeam = page.locator('[data-testid="match-detail-home-team"]');
    this.awayTeam = page.locator('[data-testid="match-detail-away-team"]');
    this.score = page.locator('[data-testid="match-detail-score"]');
    this.date = page.locator('[data-testid="match-detail-date"]');
    this.venue = page.locator('[data-testid="match-detail-venue"]');
    this.mapsLink = page.locator('[data-testid="match-detail-maps-link"]');
    this.h2h = page.locator('[data-testid="match-detail-h2h"]');
    this.h2hRows = page.locator('[data-testid="match-detail-h2h-row"]');
    this.opponentSeason = page.locator('[data-testid="match-detail-opponent-season"]');
    this.commonOpponents = page.locator('[data-testid="match-detail-common-opponents"]');
    this.commonRows = page.locator('[data-testid="match-detail-common-row"]');
    this.kampfakta = page.locator('[data-testid="match-detail-kampfakta"]');
    this.referee = page.locator('[data-testid="match-detail-referee"]');
    this.pitch = page.locator('[data-testid="match-detail-pitch"]');
    this.scorers = page.locator('[data-testid="match-detail-scorers"]');
    this.lineupHomeToggle = page.locator('[data-testid="match-detail-lineup-home-toggle"]');
    this.lineupAwayToggle = page.locator('[data-testid="match-detail-lineup-away-toggle"]');
    this.error = page.locator('[data-testid="match-detail-error"]');
    this.skeletonHero = page.locator('[data-testid="match-detail-skeleton-hero"]');
  }

  async goto(dbuMatchId: string) {
    await this.page.goto(`/matches/${dbuMatchId}`);
    await this.container.waitFor();
  }
}
