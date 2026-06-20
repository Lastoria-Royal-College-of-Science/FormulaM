import { expect, test } from "@playwright/test";
import { waitForAppReady } from "./helpers";

test("starts the app and exposes the primary work areas @smoke", async ({ page }) => {
  await waitForAppReady(page);

  await expect(page.getByRole("region", { name: "Search inputs" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Formula search space" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Spectrum import" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Interactive spectrum" })).toBeVisible();
  await expect(page.getByText("Import a peak list to render the spectrum plot.")).toBeVisible();

  const previousTheme = await page.evaluate(() => document.documentElement.dataset.theme ?? "");
  await page.getByRole("button", { name: /Switch to (light|dark) mode/ }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? "")).not.toBe(previousTheme);
});
