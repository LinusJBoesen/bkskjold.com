import { test, expect } from "../../fixtures/auth.fixture";
import { AdminPage } from "../../fixtures/pages/admin.page";

test.describe("Admin Fine Types", () => {
  test("shows system fine types in table", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.fineTypesTab.click();
    await expect(admin.fineTypesSection).toBeVisible();

    // System fine types from seed data
    await expect(admin.fineTypeRow("missing_match")).toBeVisible();
    await expect(admin.fineTypeRow("missing_training")).toBeVisible();
    await expect(admin.fineTypeRow("no_response_24h")).toBeVisible();
    await expect(admin.fineTypeRow("training_loss")).toBeVisible();
  });

  test("system fine types cannot be edited or deleted", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.fineTypesTab.click();

    // System rows should not have edit/delete buttons
    const missingMatchRow = admin.fineTypeRow("missing_match");
    await expect(missingMatchRow).toBeVisible();
    await expect(admin.fineTypeEditBtn("missing_match")).not.toBeVisible();
    await expect(admin.fineTypeDeleteBtn("missing_match")).not.toBeVisible();
  });

  test("can create a custom fine type", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.fineTypesTab.click();

    // Click add button
    await admin.addFineTypeBtn.click();
    await expect(admin.fineTypeForm).toBeVisible();

    // Fill form with unique name
    const uniqueName = `Testbøde ${Date.now()}`;
    await admin.fineTypeNameInput.fill(uniqueName);
    await admin.fineTypeAmountInput.fill("50");
    await admin.fineTypeDescriptionInput.fill("En testbeskrivelse");

    // Submit
    await admin.fineTypeSubmitBtn.click();

    // Form should close and new type should appear
    await expect(admin.fineTypeForm).not.toBeVisible();
    await expect(page.getByRole("cell", { name: uniqueName, exact: true })).toBeVisible();
  });

  test("can cancel fine type creation", async ({ authenticatedPage: page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.fineTypesTab.click();

    await admin.addFineTypeBtn.click();
    await expect(admin.fineTypeForm).toBeVisible();

    await admin.fineTypeCancelBtn.click();
    await expect(admin.fineTypeForm).not.toBeVisible();
  });
});
