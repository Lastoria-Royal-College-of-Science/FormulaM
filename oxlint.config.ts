import { defineConfig } from "oxlint";

/**
 * Default plugins from Oxlint (see https://oxc.rs/docs/guide/usage/linter/plugins.html).
 */
const defaultPlugins = ["eslint", "typescript", "unicorn", "oxc"] as const;
/**
 * Project-specific plugins for the linter.
 */
const projectPlugins = ["import", "vitest"] as const;

export default defineConfig({
  options: {
    // TypeScript/Svelte type checking remains owned by `npm run check`
    // (`svelte-check --tsconfig ./tsconfig.json`).
    typeAware: false,
    typeCheck: false,
  },

  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",

    // Formatting and stylistic consistency are handled by Oxfmt.
    style: "off",

    // Keep stricter policy rules opt-in to avoid noisy first adoption.
    pedantic: "off",
    restriction: "off",

    // Nursery rules may change; do not make them part of the stable gate.
    nursery: "off",
  },

  plugins: [...defaultPlugins, ...projectPlugins],

  env: {
    browser: true,
  },

  rules: {
    "no-console": "warn",
    "no-debugger": "error",
  },

  overrides: [
    {
      files: ["src/**/*.svelte"],
      rules: {
        "eslint/no-unassigned-vars": "off",
      },
    },
    {
      files: [
        "*.config.ts",
        "vite.config.ts",
        "vitest.config.ts",
        "playwright.config.ts",
        "uno.config.ts",
        "oxlint.config.ts",
        "oxfmt.config.ts",
      ],
      env: {
        node: true,
      },
      rules: {
        "no-console": "off",
      },
    },
    {
      files: ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
      env: {
        node: true,
      },
      rules: {
        "vitest/no-focused-tests": "error",
        "vitest/no-disabled-tests": "warn",
      },
    },
    {
      files: ["e2e/**/*.ts"],
      env: {
        browser: true,
        node: true,
      },
      rules: {
        "no-console": "off",
      },
    },
  ],

  ignorePatterns: [
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "*.min.*",
  ],
});
