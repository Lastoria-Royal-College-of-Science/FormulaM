import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Hero from "../src/components/Hero.svelte";
import PeakInspector from "../src/components/PeakInspector.svelte";
import SearchInputs from "../src/components/SearchInputs.svelte";
import SpectrumImport from "../src/components/SpectrumImport.svelte";
import SpectrumPlot from "../src/components/SpectrumPlot.svelte";
import type { PeakAssignment, PlotSettings, SearchFormState, SpectrumImportSource, SpectrumPreviewTable, SpectrumPeak } from "../src/core/types";

const inlineMz = '<code class="inline-code">m/z</code>';

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

describe("m/z inline code copy", () => {
  it("renders inline code for visible m/z labels and helper text", () => {
    expect(render(Hero).body).toContain(`observed ${inlineMz}`);

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
    expect(searchInputs).toContain(`Observed ${inlineMz}`);

    const peakInspector = render(PeakInspector, {
      props: {
        selectedPeak,
        assignment,
        onRemoveAssignment: () => undefined,
      },
    }).body;
    expect(peakInspector).toContain(`Observed ${inlineMz}:`);
    expect(peakInspector).toContain(`Predicted ${inlineMz}:`);

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
    expect(spectrumImport).toContain(`${inlineMz} column`);

    const spectrumPlot = render(SpectrumPlot, {
      props: {
        peaks: [],
        settings: plotSettings,
        onSelectPeak: () => undefined,
        onResetView: () => undefined,
      },
    }).body;
    expect(spectrumPlot).toContain(`its ${inlineMz} into FormulaM`);
  });
});
