import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import SpectrumImport from "../../src/components/spectrum/SpectrumImport.svelte";
import { shouldIgnoreFilePickerCancel } from "../../src/components/spectrum/SpectrumImport.svelte";
import type { SpectrumImportSource, SpectrumPreviewTable } from "../../src/core/types";

const sampleImportSource: SpectrumImportSource = {
  sourceName: "Kaempferol.csv",
  sheets: [
    {
      name: "Sheet1",
      table: [["m/z", "intensity"], ["100", "50"]],
      columnCount: 2,
      rowCount: 2,
      suggestedHasHeaderRow: true,
      suggestedMzColumnIndex: 0,
      suggestedIntensityColumnIndex: 1,
    },
    {
      name: "Sheet2",
      table: [["m/z", "intensity"], ["101", "60"]],
      columnCount: 2,
      rowCount: 2,
      suggestedHasHeaderRow: true,
      suggestedMzColumnIndex: 0,
      suggestedIntensityColumnIndex: 1,
    },
  ],
};

const samplePreviewTable: SpectrumPreviewTable = {
  columnLabels: ["m/z", "intensity"],
  rows: [["100", "50"]],
  totalRows: 1,
};

describe("SpectrumImport", () => {
  it("keeps the current import when the file picker closes without a new file", () => {
    expect(shouldIgnoreFilePickerCancel(null)).toBe(true);
    expect(shouldIgnoreFilePickerCancel(new File(["mz,intensity"], "replacement.csv", { type: "text/csv" }))).toBe(false);
  });

  it("renders the peak-list file input without the fixed-height text-field class", () => {
    const { body } = render(SpectrumImport, {
      props: {
        activeSheetName: "",
        disabled: false,
        hasHeaderRow: true,
        importError: "",
        importSource: null,
        intensityColumnIndex: null,
        intensityColumnName: "",
        mzColumnIndex: null,
        mzColumnName: "",
        onApplySelection: () => undefined,
        onImportFile: () => undefined,
        onSelectHasHeaderRow: () => undefined,
        onSelectIntensityColumn: () => undefined,
        onSelectMzColumn: () => undefined,
        onSelectSheet: () => undefined,
        peakCount: 0,
        previewTable: null,
        sourceName: "",
      },
    });

    expect(body).toContain('type="file"');
    expect(body).toContain('class="field-control-file"');
    expect(body).not.toContain('class="field-control" type="file"');
  });

  it("renders import field titles as non-label text outside the controls", () => {
    const { body } = render(SpectrumImport, {
      props: {
        activeSheetName: "Sheet1",
        disabled: false,
        hasHeaderRow: true,
        importError: "",
        importSource: sampleImportSource,
        intensityColumnIndex: 1,
        intensityColumnName: "intensity",
        mzColumnIndex: 0,
        mzColumnName: "m/z",
        onApplySelection: () => undefined,
        onImportFile: () => undefined,
        onSelectHasHeaderRow: () => undefined,
        onSelectIntensityColumn: () => undefined,
        onSelectMzColumn: () => undefined,
        onSelectSheet: () => undefined,
        peakCount: 1,
        previewTable: samplePreviewTable,
        sourceName: "Kaempferol.csv",
      },
    });

    expect(body).not.toContain("<label");
    expect(body).toContain('aria-label="Peak list file"');
    expect(body).toContain('aria-label="Worksheet"');
    expect(body).toContain('aria-label="m/z column"');
    expect(body).toContain('aria-label="Intensity column"');
  });
});
