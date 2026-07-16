import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import SearchInputs from "../../src/components/search/SearchInputs.svelte";
import { PPM_ERROR_TEX } from "../../src/core/math/tex";
import { createDefaultSearchForm } from "../../src/core/search/searchForm";
import { enabledInteractiveControlsWithTitles } from "./titleAssertions";

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

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const removedBusyConstant = ["BUSY", "DISABLED", "TITLE"].join("_");
const removedDefaultConstant = ["DEFAULT", "DISABLED", "TITLE"].join("_");

const appSource = readFileSync(new URL("../../src/App.svelte", import.meta.url), "utf8");
const coreTypesSource = readFileSync(new URL("../../src/core/types.ts", import.meta.url), "utf8");

const searchInputsSource = readFileSync(
  new URL("../../src/components/search/SearchInputs.svelte", import.meta.url),
  "utf8",
);

const formulaSpaceTableSource = readFileSync(
  new URL("../../src/components/search/FormulaSpaceTable.svelte", import.meta.url),
  "utf8",
);

const spectrumImportSource = readFileSync(
  new URL("../../src/components/spectrum/SpectrumImport.svelte", import.meta.url),
  "utf8",
);

const plotSettingsPanelSource = readFileSync(
  new URL("../../src/components/spectrum/PlotSettingsPanel.svelte", import.meta.url),
  "utf8",
);

const exportPanelSource = readFileSync(
  new URL("../../src/components/spectrum/ExportPanel.svelte", import.meta.url),
  "utf8",
);

const resultsTableSource = readFileSync(
  new URL("../../src/components/results/ResultsTable.svelte", import.meta.url),
  "utf8",
);

const disabledTitleCleanupSources = [
  appSource,
  searchInputsSource,
  formulaSpaceTableSource,
  spectrumImportSource,
  plotSettingsPanelSource,
  exportPanelSource,
  resultsTableSource,
  readFileSync(
    new URL("../../src/components/spectrum/SpectrumPlot.svelte", import.meta.url),
    "utf8",
  ),
];

const globalDisabledFeatureSources = [
  searchInputsSource,
  formulaSpaceTableSource,
  spectrumImportSource,
  plotSettingsPanelSource,
  exportPanelSource,
];

const toggleSwitchSource = readFileSync(
  new URL("../../src/components/ui/ToggleSwitch.svelte", import.meta.url),
  "utf8",
);

function collectSourceAndTestFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return collectSourceAndTestFiles(path);
    return /\.(?:svelte|ts)$/.test(entry) ? [path] : [];
  });
}

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
    expect(body.indexOf('aria-label="Enable ppm tolerance"')).toBeLessThan(
      body.indexOf('id="tolerancePpm"'),
    );
    expect(body.indexOf('aria-label="Enable Da tolerance"')).toBeLessThan(
      body.indexOf('id="toleranceDa"'),
    );
    expect(body).toContain('value="0.01"');
    expect(body).not.toMatch(/<input[^>]*id="tolerancePpm"[^>]*disabled/);
    expect(body).toMatch(/<input[^>]*id="toleranceDa"[^>]*disabled/);
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
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
    expect(body).toContain('title="Enter a valid charge magnitude or range before confirming."');
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
  });

  it("omits titles from enabled charge confirmation controls", () => {
    const form = {
      ...createDefaultSearchForm(),
      chargeInputText: "2",
    };
    const { body } = render(SearchInputs, {
      props: {
        form,
        ...baseProps,
      },
    });

    expect(body).toContain("i-codex-check");
    expect(body).toContain('aria-label="Confirm new positive charge"');
    expect(body).not.toContain(
      'title="Enter a valid charge magnitude or range before confirming."',
    );
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
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
    expect(body).toContain('title="Enable ppm tolerance before editing this value."');
    expect(body).toContain('title="Enable Da tolerance before editing this value."');
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
  });

  it("omits titles from enabled tolerance inputs", () => {
    const form = {
      ...createDefaultSearchForm(),
      tolerancePpmEnabled: true,
      toleranceDaEnabled: true,
    };
    const { body } = render(SearchInputs, {
      props: {
        form,
        ...baseProps,
      },
    });

    expect(body).not.toMatch(/<input[^>]*id="tolerancePpm"[^>]*disabled/);
    expect(body).not.toMatch(/<input[^>]*id="toleranceDa"[^>]*disabled/);
    expect(body).not.toContain('title="Enable ppm tolerance before editing this value."');
    expect(body).not.toContain('title="Enable Da tolerance before editing this value."');
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
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

  it("keeps charge and toggle hover borders limited to enabled controls", () => {
    expect(searchInputsSource).toContain(".charge-field-shell:hover");
    expect(searchInputsSource).not.toContain("charge-field-shell-disabled");
    expect(searchInputsSource).toContain(".charge-polarity-switch:enabled:hover");
    expect(searchInputsSource).toContain(".charge-chip-action:enabled:hover");
    expect(searchInputsSource).toContain(".charge-draft-action:enabled:hover");
    expect(searchInputsSource).toContain(".charge-chip:has(.charge-chip-target:enabled:hover)");
    expect(searchInputsSource).toContain(".charge-field-shell:has(.charge-draft-input:focus)");
    expect(toggleSwitchSource).toContain(".toggle-switch:enabled:hover");
    expect(toggleSwitchSource).not.toContain(".toggle-switch:enabled:hover {\n    box-shadow");
    expect(toggleSwitchSource).not.toContain(".toggle-switch:enabled:focus,\n");
  });

  it("keeps disabled-title source logic direct and explicit", () => {
    const sourceAndTestText = [
      ...collectSourceAndTestFiles(join(repoRoot, "src")),
      ...collectSourceAndTestFiles(join(repoRoot, "tests")),
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(sourceAndTestText).not.toContain(removedBusyConstant);
    expect(sourceAndTestText).not.toContain(removedDefaultConstant);
    expect(appSource).not.toContain("isBusy");
    expect(appSource).not.toContain("currentOperationDisabledReason");
    expect(appSource).not.toContain("let status");
    expect(appSource).not.toContain("status =");
    expect(coreTypesSource).not.toContain("AppStatus");
    for (const source of globalDisabledFeatureSources) {
      expect(source).not.toContain("export let disabled = false");
      expect(source).not.toContain("export let disabledReason");
      expect(source).not.toContain("disabledTitle(disabled, disabledReason)");
    }
    expect(spectrumImportSource).toContain("export let importing = false");
    for (const source of disabledTitleCleanupSources) {
      expect(source).not.toMatch(/function\s+\w*Title\s*\(/);
      expect(source).not.toMatch(/\$:\s+\w*Title\s*=/);
      expect(source).toContain("title={disabledTitle(");
    }
    expect(resultsTableSource).toMatch(/title=\{disabledTitle\(\s*assignmentDisabled,/);
    expect(resultsTableSource).toMatch(/title=\{disabledTitle\(previousPageDisabled,/);
    expect(resultsTableSource).toMatch(/title=\{disabledTitle\(nextPageDisabled,/);
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
