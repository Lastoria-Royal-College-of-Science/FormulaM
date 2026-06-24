import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import config from "../../uno.config";

const globalCss = readFileSync(new URL("../../src/styles/global.css", import.meta.url), "utf8");
const topBarSource = readFileSync(
  new URL("../../src/components/layout/TopBar.svelte", import.meta.url),
  "utf8",
);
const shortcuts = config.shortcuts as Record<string, string>;
const theme = config.theme as {
  colors: Record<string, string>;
  shadow: Record<string, string>;
};
const safelist = config.safelist as string[];
const primaryActionPressedStateTokens = [
  "enabled:hover:bg-surface-2",
  "enabled:hover:text-text",
  "enabled:active:bg-surface-2",
  "enabled:active:text-text",
];

describe("Uno interaction shortcuts", () => {
  it("limits button hover, focus, and active affordances to enabled controls", () => {
    expect(shortcuts["primary-action"]).toContain("enabled:hover:[border-color:var(--accent)]");
    expect(shortcuts["primary-action"]).toContain("enabled:active:[border-color:var(--accent)]");
    ["primary-action", "icon-action", "results-assign-button-active"].forEach((shortcutName) => {
      primaryActionPressedStateTokens.forEach((token) => {
        expect(shortcuts[shortcutName]).toContain(token);
      });
    });
    expect(shortcuts["primary-action"]).toContain("[--control-rest-border:transparent]");
    expect(shortcuts["primary-action"]).toContain(
      "[&:not(:disabled):focus-visible:not(:hover):not(:active)]:[border-color:var(--control-rest-border)]",
    );
    expect(shortcuts["primary-action"]).toContain("enabled:focus-visible:shadow-control-glow");
    expect(shortcuts["primary-action"]).not.toContain("enabled:focus:[border-color:var(--accent)]");
    expect(shortcuts["primary-action"]).not.toContain(
      "enabled:focus-visible:[border-color:var(--accent)]",
    );
    expect(shortcuts["primary-action"]).not.toContain("enabled:hover:shadow-control-glow");
    expect(shortcuts["secondary-action"]).toContain("enabled:hover:[border-color:var(--accent)]");
    expect(shortcuts["secondary-action"]).toContain(
      "[--control-rest-border:var(--control-border)]",
    );
    expect(shortcuts["secondary-action"]).not.toContain(
      "enabled:focus:[border-color:var(--accent)]",
    );
    expect(shortcuts["secondary-action"]).toContain("enabled:active:shadow-control-glow");
    expect(shortcuts["secondary-action"]).not.toContain("enabled:hover:shadow-control-glow");
    expect(shortcuts["field-control"]).toContain("enabled:hover:[border-color:var(--accent)]");
    expect(shortcuts["field-control"]).toContain("enabled:focus:[border-color:var(--accent)]");
    expect(shortcuts["field-control"]).toContain(
      "enabled:focus-visible:[border-color:var(--accent)]",
    );
    expect(shortcuts["field-control"]).not.toContain("enabled:hover:shadow-control-glow");
    expect(shortcuts["icon-action"]).toContain("enabled:hover:[border-color:var(--accent)]");
    expect(shortcuts["icon-action"]).toContain("enabled:active:[border-color:var(--accent)]");
    expect(shortcuts["icon-action"]).not.toContain("enabled:focus:[border-color:var(--accent)]");
    expect(shortcuts["danger-icon-action"]).toContain("enabled:hover:[border-color:var(--accent)]");
    expect(shortcuts["danger-icon-action"]).not.toContain(
      "enabled:focus:[border-color:var(--accent)]",
    );
  });

  it("keeps link controls visually consistent with buttons", () => {
    expect(shortcuts["round-link-control"]).toContain(
      "hover:[filter:var(--interactive-hover-filter)]",
    );
    expect(shortcuts["round-link-control"]).toContain("hover:[border-color:var(--accent)]");
    expect(shortcuts["round-link-control"]).toContain("active:[border-color:var(--accent)]");
    expect(shortcuts["round-link-control"]).toContain("active:shadow-control-glow");
    expect(shortcuts["round-link-control"]).not.toContain("focus:[border-color:var(--accent)]");
    expect(shortcuts["round-link-control"]).not.toContain(
      "focus-visible:[border-color:var(--accent)]",
    );
    expect(shortcuts["round-link-control"]).not.toContain("hover:shadow-control-glow");
  });

  it("keeps result sort buttons on a stable hoverable border", () => {
    expect(shortcuts["results-sort-button"]).toContain("border-transparent");
    expect(shortcuts["results-sort-button"]).toContain("[--control-rest-border:transparent]");
    expect(shortcuts["results-sort-button"]).toContain("hover:[border-color:var(--accent)]");
    expect(shortcuts["results-sort-button"]).toContain("active:[border-color:var(--accent)]");
    expect(shortcuts["results-sort-button"]).not.toContain("focus:[border-color:var(--accent)]");
    expect(shortcuts["results-sort-button"]).not.toContain(
      "focus-visible:[border-color:var(--accent)]",
    );
    expect(shortcuts["results-sort-button"]).toContain("focus-visible:shadow-control-glow");
    expect(shortcuts["results-sort-button"]).not.toContain("border-none");
    expect(shortcuts["results-sort-button"]).not.toContain("hover:shadow-control-glow");
  });

  it("keeps runtime hover border rules above Uno shortcut layers", () => {
    expect(globalCss).toContain("):not(:disabled):hover {\n  border-color: var(--accent);");
    expect(topBarSource).toContain(".topbar-control-solid:hover");
    expect(topBarSource).toContain(".topbar-control-glass:hover");
    expect(topBarSource).toContain("--control-rest-border: color-mix");
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
