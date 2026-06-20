import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import SearchInputs from "../src/components/search/SearchInputs.svelte";
import { PPM_ERROR_TEX } from "../src/core/math/tex";
import { createDefaultSearchForm } from "../src/core/search/searchForm";

function texAnnotation(tex: string): string {
  return `<annotation encoding="application/x-tex">${tex}</annotation>`;
}

const baseProps = {
  onChange: () => undefined,
  onChargeInputTextChange: () => undefined,
  onChargeEditTextChange: () => undefined,
  onCommitChargeInput: () => undefined,
  onCommitChargeEdit: () => undefined,
  onCancelChargeEdit: () => undefined,
  onRemoveChargeEntry: () => undefined,
  onStartChargeEdit: () => undefined,
};

describe("SearchInputs", () => {
  it("renders the expanded explicit-charge editor and keeps tolerance toggles", () => {
    const form = createDefaultSearchForm();
    const { body } = render(SearchInputs, {
      props: {
        form,
        ...baseProps,
      },
    });

    expect(body).not.toContain("Tolerance mode");
    expect(body).toContain('class="block col-span-2 lt-md:col-span-1"');
    expect(body).toContain('role="switch"');
    expect(body).toContain("charge-polarity-thumb");
    expect(body).toContain('aria-label="Selected charges"');
    expect(body).toContain('placeholder="n or min-max"');
    expect(body).toContain("i-codex-cross");
    expect(body).toContain("i-mdi-minus");
    expect(body).toContain("i-mdi-add");
    expect(body.match(/i-mdi-help/g)).toHaveLength(2);
    expect(body).not.toContain("i-codex-check");
    expect(body).not.toContain(">+1<");
    expect(body.match(/role="switch"/g)).toHaveLength(3);
    expect(body.match(/<button[^>]*class="[^"]*\btoggle-switch\b[^"]*"/g)).toHaveLength(2);
    expect(body.indexOf('aria-label="Enable ppm tolerance"')).toBeLessThan(body.indexOf('id="tolerancePpm"'));
    expect(body.indexOf('aria-label="Enable Da tolerance"')).toBeLessThan(body.indexOf('id="toleranceDa"'));
    expect(body).toContain('value="0.01"');
    expect(body).not.toMatch(/<input[^>]*id="tolerancePpm"[^>]*disabled/);
    expect(body).toMatch(/<input[^>]*id="toleranceDa"[^>]*disabled/);
  });

  it("shows the draft confirm button only when the user is typing a charge", () => {
    const form = {
      ...createDefaultSearchForm(),
      chargeInputText: "2-",
    };
    const { body } = render(SearchInputs, {
      props: {
        form,
        ...baseProps,
      },
    });

    expect(body).toContain("i-codex-check");
    expect(body).toContain('aria-label="Confirm new positive charge"');
  });

  it("disables both tolerance inputs when their toggles are off", () => {
    const form = {
      ...createDefaultSearchForm(),
      tolerancePpmEnabled: false,
      toleranceDaEnabled: false,
    };
    const { body } = render(SearchInputs, {
      props: {
        form,
        ...baseProps,
      },
    });

    expect(body).toMatch(/<input[^>]*id="tolerancePpm"[^>]*disabled/);
    expect(body).toMatch(/<input[^>]*id="toleranceDa"[^>]*disabled/);
  });

  it("keeps field titles outside the interactive hit area", () => {
    const { body } = render(SearchInputs, {
      props: {
        form: createDefaultSearchForm(),
        ...baseProps,
      },
    });

    expect(body).not.toContain('<label for="tolerancePpm">');
    expect(body).not.toContain('<label class="block">');
    expect(body).toContain('aria-label="Observed m/z"');
    expect(body).toContain('aria-label="Tolerance ppm"');
    expect(body).toContain('aria-label="Tolerance Da"');
    expect(body).toContain('aria-label="Max results"');
  });

  it("centers help dialogs and renders ppm help as display math", () => {
    const { body } = render(SearchInputs, {
      props: {
        form: createDefaultSearchForm(),
        ...baseProps,
      },
    });

    expect(body.match(/\bhelp-dialog\b/g)).toHaveLength(2);
    expect(body).toContain("help-equation");
    expect(body).not.toContain("overflow-x-auto");
    expect(body).toContain("math-tex-display");
    expect(body).toContain("katex-display");
    expect(body).toContain(texAnnotation(PPM_ERROR_TEX));
    expect(body).toContain('data-selectable-formula="true"');
  });
});
