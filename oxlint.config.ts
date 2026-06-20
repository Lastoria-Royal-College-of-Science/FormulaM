import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "vitest", "import"],
  ignorePatterns: ["dist/**", "coverage/**", "playwright-report/**", "test-results/**"],
  rules: {
    "no-console": "warn",
    "no-debugger": "error",
    "typescript/no-unused-vars": "warn"
  }
});
