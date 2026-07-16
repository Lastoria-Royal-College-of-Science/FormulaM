import { defineConfig, presetIcons, presetWind4 } from "unocss";

import { shortcuts } from "./src/styles/uno-shortcuts";
import { theme } from "./src/styles/uno-tokens";

export default defineConfig({
  presets: [
    presetWind4({
      preflights: {
        reset: true,
        theme: {
          mode: "on-demand",
        },
        property: true,
      },
    }),
    presetIcons(),
  ],
  safelist: [
    "i-typcn-arrow-unsorted",
    "i-typcn-arrow-sorted-up",
    "i-typcn-arrow-sorted-down",
    "i-codex-check",
    "i-codex-cross",
    "i-mdi-eye-outline",
    "i-mdi-eye-off-outline",
  ],
  theme,
  shortcuts,
});
