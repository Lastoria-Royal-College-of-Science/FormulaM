import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      bail: 1,
      fileParallelism: true,
      sequence: {
        concurrent: false,
      },
      projects: [
        {
          extends: true,
          test: {
            name: "smoke",
            include: ["tests/smoke.test.ts"],
            sequence: {
              concurrent: false,
              groupOrder: 0,
            },
          },
        },
        {
          extends: true,
          test: {
            name: "regression",
            include: ["tests/**/*.test.ts"],
            exclude: ["tests/smoke.test.ts"],
            sequence: {
              concurrent: false,
              groupOrder: 1,
            },
          },
        },
      ],
    },
  }),
);
