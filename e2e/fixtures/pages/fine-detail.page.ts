import { type Page, type Locator } from "@playwright/test";

export class FineDetailPage {
  readonly page: Page;
  readonly container: Locator;
  readonly total: Locator;
  readonly addButton: Locator;
  readonly createForm: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="page-fine-detail"]');
    this.total = page.locator('[data-testid="fine-detail-total"]');
    this.addButton = page.locator('[data-testid="fine-add-button"]');
    this.createForm = page.locator('[data-testid="fine-create-form"]');
    this.backButton = page.locator('[data-testid="fine-detail-back"]');
  }

  async createFine(typeId: string, amount: string, notes?: string) {
    await this.addButton.click();
    await this.page.locator('[data-testid="fine-create-type"]').selectOption(typeId);
    await this.page.locator('[data-testid="fine-create-amount"]').fill(amount);
    if (notes) {
      await this.page.locator('[data-testid="fine-create-notes"]').fill(notes);
    }
    await this.page.locator('[data-testid="fine-create-submit"]').click();
  }
}
