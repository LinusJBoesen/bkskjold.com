import { type Page, type Locator } from "@playwright/test";

export class AdminPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly tabs: Locator;
  readonly configTab: Locator;
  readonly fineTypesTab: Locator;
  readonly dataTab: Locator;
  readonly positionsTab: Locator;
  readonly configSection: Locator;
  readonly fineTypesSection: Locator;
  readonly positionsSection: Locator;
  readonly dataSection: Locator;
  readonly addFineTypeBtn: Locator;
  readonly fineTypeForm: Locator;
  readonly fineTypeNameInput: Locator;
  readonly fineTypeAmountInput: Locator;
  readonly fineTypeDescriptionInput: Locator;
  readonly fineTypeSubmitBtn: Locator;
  readonly fineTypeCancelBtn: Locator;
  readonly exportBtn: Locator;
  readonly importBtn: Locator;
  readonly dataStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('[data-testid="page-admin"] h1');
    this.tabs = page.locator('[data-testid="admin-tabs"]');
    this.configTab = page.locator('[data-testid="admin-tab-config"]');
    this.fineTypesTab = page.locator('[data-testid="admin-tab-fineTypes"]');
    this.dataTab = page.locator('[data-testid="admin-tab-data"]');
    this.positionsTab = page.locator('[data-testid="admin-tab-positions"]');
    this.configSection = page.locator('[data-testid="admin-config-section"]');
    this.fineTypesSection = page.locator('[data-testid="admin-fine-types-section"]');
    this.positionsSection = page.locator('[data-testid="admin-positions-section"]');
    this.dataSection = page.locator('[data-testid="admin-data-section"]');
    this.addFineTypeBtn = page.locator('[data-testid="admin-fine-type-add"]');
    this.fineTypeForm = page.locator('[data-testid="admin-fine-type-form"]');
    this.fineTypeNameInput = page.locator('[data-testid="admin-fine-type-name"]');
    this.fineTypeAmountInput = page.locator('[data-testid="admin-fine-type-amount"]');
    this.fineTypeDescriptionInput = page.locator('[data-testid="admin-fine-type-description"]');
    this.fineTypeSubmitBtn = page.locator('[data-testid="admin-fine-type-submit"]');
    this.fineTypeCancelBtn = page.locator('[data-testid="admin-fine-type-cancel"]');
    this.exportBtn = page.locator('[data-testid="admin-export-btn"]');
    this.importBtn = page.locator('[data-testid="admin-import-btn"]');
    this.dataStatus = page.locator('[data-testid="admin-data-status"]');
  }

  async goto() {
    await this.page.goto("/admin");
  }

  configInput(key: string) {
    return this.page.locator(`[data-testid="admin-config-input-${key}"]`);
  }

  configSaveBtn(key: string) {
    return this.page.locator(`[data-testid="admin-config-save-${key}"]`);
  }

  fineTypeRow(id: string) {
    return this.page.locator(`[data-testid="admin-fine-type-row-${id}"]`);
  }

  fineTypeEditBtn(id: string) {
    return this.page.locator(`[data-testid="admin-fine-type-edit-${id}"]`);
  }

  fineTypeDeleteBtn(id: string) {
    return this.page.locator(`[data-testid="admin-fine-type-delete-${id}"]`);
  }
}
