import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:5173";
const smokeTagPattern = /@smoke/;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "smoke",
      grep: smokeTagPattern,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "regression",
      grepInvert: smokeTagPattern,
      dependencies: ["smoke"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
