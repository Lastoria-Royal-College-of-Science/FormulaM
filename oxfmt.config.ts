import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed",
  trailingComma: "all",
  bracketSpacing: true,
  bracketSameLine: false,
  singleAttributePerLine: false,
  objectWrap: "preserve",

  insertFinalNewline: true,

  proseWrap: "preserve",
  htmlWhitespaceSensitivity: "css",
  embeddedLanguageFormatting: "auto",

  svelte: {
    indentScriptAndStyle: true,
    sortOrder: "options-scripts-markup-styles",
  },

  sortImports: {
    newlinesBetween: true,
    sortSideEffects: false,
    groups: [
      ["builtin", "external"],
      ["internal", "subpath"],
      ["parent", "sibling", "index"],
      "style",
      "unknown",
    ],
  },

  sortPackageJson: {
    sortScripts: false,
  },

  // FormulaM uses UnoCSS rather than Tailwind CSS. Keep class ordering under
  // project control unless Oxfmt gains first-class UnoCSS-aware sorting.
  sortTailwindcss: false,

  ignorePatterns: [
    "dist/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "*.min.*",
  ],
});
