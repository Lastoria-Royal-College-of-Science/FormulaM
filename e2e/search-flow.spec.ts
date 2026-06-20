import { expect, test } from "@playwright/test";
import { glucoseFormula, runDefaultSearch } from "./helpers";

test("finds a glucose candidate through the browser UI", async ({ page }) => {
  await runDefaultSearch(page);

  await expect(page.getByLabel(glucoseFormula).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Download formula hits CSV" })).toBeEnabled();
});
