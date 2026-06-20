import { describe, expect, it } from "vitest";
import config from "../../uno.config";

const shortcuts = config.shortcuts as Record<string, string>;
const theme = config.theme as {
  colors: Record<string, string>;
  shadow: Record<string, string>;
};
const safelist = config.safelist as string[];

describe("Uno interaction shortcuts", () => {
  it("limits button focus and active affordances to enabled controls", () => {
    expect(shortcuts["primary-action"]).toContain("enabled:active:border-accent");
    expect(shortcuts["primary-action"]).toContain("enabled:focus-visible:shadow-control-glow");
    expect(shortcuts["secondary-action"]).toContain("enabled:focus:border-accent");
    expect(shortcuts["secondary-action"]).toContain("enabled:active:shadow-control-glow");
    expect(shortcuts["icon-action"]).toContain("enabled:active:border-accent");
    expect(shortcuts["danger-icon-action"]).toContain("enabled:focus:border-accent");
  });

  it("keeps link controls visually consistent with buttons", () => {
    expect(shortcuts["round-link-control"]).toContain("hover:[filter:var(--interactive-hover-filter)]");
    expect(shortcuts["round-link-control"]).toContain("active:border-accent");
    expect(shortcuts["round-link-control"]).toContain("active:shadow-control-glow");
  });

  it("keeps the native file input on an explicit height separate from text fields", () => {
    expect(shortcuts["field-control-file"]).toContain("h-[48px]");
    expect(shortcuts["field-control-file"]).toContain("min-h-[48px]");
    expect(shortcuts["field-control-file"]).toContain("py-[6px]");
    expect(shortcuts["field-control-file"]).toContain("leading-[32px]");
    expect(shortcuts["field-control-file"]).not.toContain("h-[46px]");
    expect(shortcuts["field-control-file"]).not.toContain("min-h-[46px]");
    expect(shortcuts["field-control-file"]).not.toContain("h-[42px]");
    expect(shortcuts["field-control-file"]).not.toContain("min-h-[42px]");
  });

  it("keeps theme-aware brand coloring in reusable shortcuts", () => {
    expect(shortcuts["hero-logo"]).toContain("mx-auto");
    expect(shortcuts["hero-logo"]).toContain("[margin-inline:auto]");
    expect(shortcuts["hero-logo"]).toContain("object-contain");
    expect(shortcuts["topbar-brand-mark"]).toContain("transition-[filter]");
    expect(shortcuts["brand-logo-light"]).toContain("filter-none");
    expect(shortcuts["brand-logo-dark"]).toContain("invert");
    expect(shortcuts["brand-logo-dark"]).toContain("hue-rotate-180");
  });

  it("keeps component-scoped structural classes outside Uno shortcuts", () => {
    [
      "topbar-shell",
      "topbar-shell-scrolled",
      "topbar-control-solid",
      "topbar-control-glass",
      "toggle-switch",
      "toggle-switch-checked",
      "toggle-switch-thumb",
      "toggle-switch-thumb-checked",
      "charge-field-shell",
      "charge-field-shell-disabled",
      "charge-entry-flow",
      "charge-polarity-switch",
      "charge-polarity-thumb",
      "charge-polarity-thumb-positive",
      "charge-polarity-mark",
      "charge-chip",
      "charge-chip-list",
      "charge-draft-shell",
    ].forEach((className) => {
      expect(shortcuts).not.toHaveProperty(className);
      expect(safelist).not.toContain(className);
    });
  });

  it("maps Wind4 theme tokens to the existing CSS variables", () => {
    expect(theme.colors.focus).toBe("var(--focus-ring)");
    expect(theme.colors.row).toBe("var(--row-odd)");
    expect(theme.shadow.app).toBe("var(--shadow)");
    expect(theme.shadow["control-glow"]).toBe("var(--control-glow)");
    expect(Reflect.get(theme, "box" + "Shadow")).toBeUndefined();
  });
});
