import { BaseSequencer, type TestSpecification } from "vitest/node";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

const SMOKE_TEST_PATH = "tests/smoke.test.ts";

function normalizeModuleId(spec: TestSpecification): string {
  return spec.moduleId.replaceAll("\\", "/");
}

function isSmokeTest(spec: TestSpecification): boolean {
  return normalizeModuleId(spec).endsWith(SMOKE_TEST_PATH);
}

class SmokeFirstSequencer extends BaseSequencer {
  override async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    const sorted = await super.sort(files);
    return [...sorted].sort((left, right) => Number(isSmokeTest(right)) - Number(isSmokeTest(left)));
  }
}

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ["tests/**/*.test.ts"],
      fileParallelism: false,
      sequence: {
        concurrent: false,
        sequencer: SmokeFirstSequencer,
      },
      bail: 1,
    },
  }),
);
