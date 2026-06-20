import { expect, test } from "@playwright/test";

import { glucoseFormulaLocator, runDefaultSearch, selectedText } from "./helpers";

test("selects rendered formula and math text without hidden helper duplication", async ({
  page,
}) => {
  await runDefaultSearch(page);

  await glucoseFormulaLocator(page).click();
  const formulaSelection = (await selectedText(page)).replace(/\s+/g, "");
  expect(formulaSelection).toMatch(/C.*6.*H.*12.*O.*6/);
  expect(formulaSelection.length).toBeLessThan(40);

  await page.evaluate(() => window.getSelection()?.removeAllRanges());

  await page.locator('[data-selectable-formula="true"][aria-label="m/z"]').first().click();
  const labelSelection = (await selectedText(page)).replace(/\s+/g, "");
  expect(labelSelection).toMatch(/m.*z/i);
  expect(labelSelection.length).toBeLessThan(20);
});
