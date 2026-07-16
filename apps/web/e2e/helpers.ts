import { expect, type Locator, type Page } from "@playwright/test";

export const glucoseFormula = "[C6H12O6]+";

export function glucoseFormulaLocator(page: Page): Locator {
  return page.locator(`[data-selectable-formula="true"][aria-label="${glucoseFormula}"]`).first();
}

export async function waitForAppReady(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Find candidate formulae" })).toBeEnabled();
}

export async function runDefaultSearch(page: Page): Promise<Locator> {
  await waitForAppReady(page);
  await page.getByRole("button", { name: "Find candidate formulae" }).click();
  await expect(page.getByRole("heading", { name: "Candidate formulae" })).toBeVisible();

  const glucose = glucoseFormulaLocator(page);
  await expect(glucose).toBeVisible();
  return glucose;
}

export async function selectedText(page: Page): Promise<string> {
  return page.evaluate(() => window.getSelection()?.toString() ?? "");
}
