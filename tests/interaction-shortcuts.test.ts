import { describe, expect, it } from "vitest";
import config from "../uno.config";

const shortcuts = config.shortcuts as Record<string, string>;

describe("Uno interaction shortcuts", () => {
  it("limits button focus and active affordances to enabled controls", () => {
    expect(shortcuts["primary-action"]).toContain("enabled:active:border-accent");
    expect(shortcuts["primary-action"]).toContain("enabled:focus-visible:shadow-control-glow");
    expect(shortcuts["secondary-action"]).toContain("enabled:focus:border-accent");
    expect(shortcuts["secondary-action"]).toContain("enabled:active:shadow-control-glow");
    expect(shortcuts["icon-action"]).toContain("enabled:active:border-accent");
    expect(shortcuts["danger-icon-action"]).toContain("enabled:focus:border-accent");
  });
});
