import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Hero from "../src/components/layout/Hero.svelte";
import PeakInspector from "../src/components/spectrum/PeakInspector.svelte";
import SearchInputs from "../src/components/search/SearchInputs.svelte";
import SpectrumImport from "../src/components/spectrum/SpectrumImport.svelte";
import SpectrumPlot from "../src/components/spectrum/SpectrumPlot.svelte";
import { MZ_TEX, PPM_ERROR_TEX } from "../src/core/math/tex";
import type { PeakAssignment, PlotSettings, SearchFormState, SpectrumImportSource, SpectrumPreviewTable, SpectrumPeak } from "../src/core/types";

function texAnnotation(tex: string): string {
  return `<annotation encoding="application/x-tex">${tex}</annotation>`;
}

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

const selectedPeak: SpectrumPeak = {
  id: "peak-1",
  mz: 100.123456,
  intensity: 200,
  relativeIntensity: 100,
};

const assignment: PeakAssignment = {
  peakId: "peak-1",
  mz: 100.123456,
  intensity: 200,
  relativeIntensity: 100,
  formula: "C6H12O6",
  ionFormula: "[C6H12O6]+",
  predictedMz: 100.123456,
  errorDa: 0,
  errorPpm: 0,
  source: "formula-search",
};

const importSource: SpectrumImportSource = {
  sourceName: "example.csv",
  sheets: [
    {
      name: "Sheet1",
      table: [["m/z", "Intensity"], [100.1, 50]],
      columnCount: 2,
      rowCount: 2,
      suggestedHasHeaderRow: true,
      suggestedMzColumnIndex: 0,
      suggestedIntensityColumnIndex: 1,
    },
  ],
};

const previewTable: SpectrumPreviewTable = {
  columnLabels: ["m/z", "Intensity"],
  rows: [["100.1", "50"]],
  totalRows: 1,
};

const plotSettings: PlotSettings = {
  yScale: "auto",
  thresholdEnabled: false,
  thresholdPercent: 0,
  autoTicks: true,
  peakColor: "#58a6ff",
  selectedPeakColor: "#56d364",
  assignedPeakColor: "#79c0ff",
  lineWidth: 2,
  showLabels: false,
  showPeakMzLabels: false,
  showFormulaLabels: false,
  labelMode: "formula",
  labelFilter: "assigned-only",
};

describe("DOM math label rendering", () => {
  it("renders KaTeX for visible m/z labels and helper text", () => {
    expect(render(Hero).body).toContain(texAnnotation(MZ_TEX));

    const searchInputs = render(SearchInputs, {
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
    expect(searchInputs).toContain(texAnnotation(MZ_TEX));
    expect(searchInputs).toContain(texAnnotation(PPM_ERROR_TEX));

    const peakInspector = render(PeakInspector, {
      props: {
        selectedPeak,
        assignment,
        onRemoveAssignment: () => undefined,
      },
    }).body;
    expect(peakInspector).toContain(texAnnotation(MZ_TEX));
    expect(peakInspector).toContain(texAnnotation("\\ce{[C6H12O6]+}"));
    expect(peakInspector).not.toContain(texAnnotation("\\ce{C6H12O6}"));
    expect(peakInspector).not.toContain("Ion formula:");

    const spectrumImport = render(SpectrumImport, {
      props: {
        activeSheetName: "Sheet1",
        hasHeaderRow: true,
        importError: "",
        importSource,
        intensityColumnIndex: 1,
        intensityColumnName: "Intensity",
        mzColumnIndex: 0,
        mzColumnName: "m/z",
        onApplySelection: () => undefined,
        onImportFile: () => undefined,
        onSelectHasHeaderRow: () => undefined,
        onSelectIntensityColumn: () => undefined,
        onSelectMzColumn: () => undefined,
        onSelectSheet: () => undefined,
        peakCount: 1,
        previewTable,
        sourceName: "example.csv",
      },
    }).body;
    expect(spectrumImport).toContain(texAnnotation(MZ_TEX));

    const spectrumPlot = render(SpectrumPlot, {
      props: {
        peaks: [],
        settings: plotSettings,
        onSelectPeak: () => undefined,
        onResetView: () => undefined,
      },
    }).body;
    expect(spectrumPlot).toContain(texAnnotation(MZ_TEX));
    expect(searchInputs).toContain('<code class="inline-code">n</code>');
    expect(searchInputs).toContain('<code class="inline-code">min-max</code>');
    expect(spectrumImport).toContain('<code class="inline-code">.csv</code>');
  });

  it("marks the hero logo for topbar visibility and theme coloring", () => {
    const lightHero = render(Hero, { props: { theme: "light" } }).body;
    expect(lightHero).toContain("data-hero-logo=\"true\"");
    expect(lightHero).toContain("hero-logo brand-logo-light");

    const darkHero = render(Hero, { props: { theme: "dark" } }).body;
    expect(darkHero).toContain("hero-logo brand-logo-dark");
  });

  it("shows the assigned ion formula as the single Peak inspector formula row", () => {
    const peakInspector = render(PeakInspector, {
      props: {
        selectedPeak,
        assignment,
        onRemoveAssignment: () => undefined,
      },
    }).body;

    expect(peakInspector.match(/<strong class="text-text">Formula:<\/strong>/g)).toHaveLength(1);
    expect(peakInspector).toContain(texAnnotation("\\ce{[C6H12O6]+}"));
    expect(peakInspector).not.toContain(texAnnotation("\\ce{C6H12O6}"));
    expect(peakInspector).not.toContain("Ion formula:");
  });
});
