import { readFileSync } from "node:fs";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import SearchInputs from "../../src/components/search/SearchInputs.svelte";
import PlotSettingsPanel from "../../src/components/spectrum/PlotSettingsPanel.svelte";
import ChemicalFormula from "../../src/components/ui/ChemicalFormula.svelte";
import MathTex from "../../src/components/ui/MathTex.svelte";
import { MZ_TEX, PPM_ERROR_TEX } from "../../src/core/math/tex";
import { DEFAULT_PLOT_SETTINGS } from "../../src/core/plot/plotTicks";
import type { SearchFormState } from "../../src/core/types";

function texAnnotation(tex: string): string {
  return `<annotation encoding="application/x-tex">${tex}</annotation>`;
}

const mathTexSource = readFileSync(
  new URL("../../src/components/ui/MathTex.svelte", import.meta.url),
  "utf8",
);

const form: SearchFormState = {
  mz: "",
  chargeEntries: [],
  chargeSign: "+",
  chargeInputText: "",
  chargeEditId: null,
  chargeEditText: "",
  tolerancePpmEnabled: true,
  toleranceDaEnabled: false,
  tolerancePpm: "5",
  toleranceDa: "0.001",
  maxResults: 100,
};

function renderSearchInputs(): string {
  return render(SearchInputs, {
    props: {
      form,
      onChange: () => undefined,
      onChargeInputTextChange: () => undefined,
      onChargeEditTextChange: () => undefined,
      onCommitChargeInput: () => undefined,
      onCommitChargeEdit: () => undefined,
      onCancelChargeEdit: () => undefined,
      onRemoveChargeEntry: () => undefined,
      onStartChargeEdit: () => undefined,
    },
  }).body;
}

describe("selectable formula rendering", () => {
  it("makes MathTex selectable by default", () => {
    const { body } = render(MathTex, { props: { tex: MZ_TEX, ariaLabel: "m/z", fallback: "m/z" } });

    expect(body).toContain(texAnnotation(MZ_TEX));
    expect(body).toContain('data-selectable-formula="true"');
    expect(body).toContain('tabindex="0"');
    expect(body).toContain("math-tex-inline");
    expect(body).toContain("math-tex-selectable");
  });

  it("omits selectable markup when MathTex opts out", () => {
    const { body } = render(MathTex, {
      props: { tex: MZ_TEX, ariaLabel: "m/z", fallback: "m/z", selectable: false },
    });

    expect(body).toContain(texAnnotation(MZ_TEX));
    expect(body).not.toContain('data-selectable-formula="true"');
    expect(body).not.toContain('tabindex="0"');
    expect(body).not.toContain("math-tex-selectable");
  });

  it("keeps selectable markup customizable", () => {
    const { body } = render(MathTex, {
      props: { tex: PPM_ERROR_TEX, selectionLabel: "Click to select equation" },
    });

    expect(body).toContain(texAnnotation(PPM_ERROR_TEX));
    expect(body).toContain('title="Click to select equation"');
  });

  it("renders display math as a selectable display block", () => {
    const { body } = render(MathTex, { props: { tex: PPM_ERROR_TEX, displayMode: true } });

    expect(body).toContain(texAnnotation(PPM_ERROR_TEX));
    expect(body).toContain("math-tex-display");
    expect(body).toContain("katex-display");
    expect(body).toContain('data-selectable-formula="true"');
    expect(body).toContain('tabindex="0"');
  });

  it("keeps hidden and transparent KaTeX helper layers out of visible selection", () => {
    const { body } = render(MathTex, { props: { tex: MZ_TEX } });
    const chemicalFormula = render(ChemicalFormula, { props: { formula: "[C6H12O6]+" } }).body;

    expect(body).toContain('class="katex-mathml"');
    expect(body).toContain('class="katex-html"');
    expect(chemicalFormula).toContain("color:transparent");
    expect(mathTexSource).toContain('root.querySelector<HTMLElement>(".katex-html") ?? root');
    expect(mathTexSource).toContain(".math-tex :global(.katex-mathml)");
    expect(mathTexSource).toContain("user-select: none;");
    expect(mathTexSource).toContain(".math-tex :global(.katex-html)");
    expect(mathTexSource).toContain("user-select: text;");
    expect(mathTexSource).toContain('[style*="color:transparent"]');
    expect(mathTexSource).toContain("-webkit-user-select: none;");
  });

  it("makes KaTeX chemical formulas selectable", () => {
    const { body } = render(ChemicalFormula, { props: { formula: "C6H12O6" } });

    expect(body).toContain(texAnnotation("\\ce{C6H12O6}"));
    expect(body).toContain('data-selectable-formula="true"');
    expect(body).toContain('tabindex="0"');
    expect(body).toContain("math-tex-selectable");
  });

  it("makes fallback chemical formula rendering selectable", () => {
    const { body } = render(ChemicalFormula, { props: { formula: "C6H12O6;" } });

    expect(body).toContain('data-selectable-formula="true"');
    expect(body).toContain('tabindex="0"');
    expect(body).toContain("chemical-formula-selectable");
    expect(body).toMatch(/<sub\b[^>]*>6<\/sub>/);
  });

  it("makes formulas in selectable text selectable by default", () => {
    const searchInputs = renderSearchInputs();
    const plotSettings = render(PlotSettingsPanel, {
      props: {
        settings: DEFAULT_PLOT_SETTINGS,
        peaks: [],
        onChange: () => undefined,
      },
    }).body;

    expect(searchInputs).toContain(texAnnotation(MZ_TEX));
    expect(searchInputs).toContain(texAnnotation(PPM_ERROR_TEX));
    expect(searchInputs).toContain("math-tex-display");
    expect(searchInputs).toContain("katex-display");
    expect(searchInputs.match(/data-selectable-formula="true"/g)).toHaveLength(2);
    expect(plotSettings.match(/data-selectable-formula="true"/g)).toHaveLength(3);
  });
});
