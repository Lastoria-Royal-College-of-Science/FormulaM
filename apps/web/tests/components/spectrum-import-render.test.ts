import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import SpectrumImport from "../../src/components/spectrum/SpectrumImport.svelte";
import { shouldIgnoreFilePickerCancel } from "../../src/components/spectrum/SpectrumImport.svelte";
import type { SpectrumImportSource, SpectrumPreviewTable } from "../../src/core/types";
import { enabledInteractiveControlsWithTitles } from "./titleAssertions";

const sampleImportSource: SpectrumImportSource = {
  sourceName: "Kaempferol.csv",
  sheets: [
    {
      name: "Sheet1",
      table: [
        ["m/z", "intensity"],
        ["100", "50"],
      ],
      columnCount: 2,
      rowCount: 2,
      suggestedHasHeaderRow: true,
      suggestedMzColumnIndex: 0,
      suggestedIntensityColumnIndex: 1,
    },
    {
      name: "Sheet2",
      table: [
        ["m/z", "intensity"],
        ["101", "60"],
      ],
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
    expect(
      shouldIgnoreFilePickerCancel(
        new File(["mz,intensity"], "replacement.csv", { type: "text/csv" }),
      ),
    ).toBe(false);
  });

  it("renders the peak-list file input without the fixed-height text-field class", () => {
    const { body } = render(SpectrumImport, {
      props: {
        activeSheetName: "",
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
    expect(body).toContain('title="Import a spectrum before clearing it."');
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
    expect(body).not.toContain('class="field-control" type="file"');
  });

  it("renders import field titles as non-label text outside the controls", () => {
    const { body } = render(SpectrumImport, {
      props: {
        activeSheetName: "Sheet1",
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
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
  });

  it("explains disabled import controls", () => {
    const emptyPreviewTable: SpectrumPreviewTable = {
      columnLabels: [],
      rows: [],
      totalRows: 0,
    };
    const { body } = render(SpectrumImport, {
      props: {
        activeSheetName: "Sheet1",
        hasHeaderRow: true,
        importError: "",
        importSource: sampleImportSource,
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
        previewTable: emptyPreviewTable,
        sourceName: "Kaempferol.csv",
      },
    });

    expect(body).toContain('title="Load a peak-list preview before choosing columns."');
    expect(body).toContain('title="Select m/z and intensity columns before importing."');
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
  });

  it("explains import controls disabled during an active spectrum import", () => {
    const { body } = render(SpectrumImport, {
      props: {
        activeSheetName: "Sheet1",
        importing: true,
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

    expect(body).toContain('title="Wait for the current spectrum import to finish."');
    expect(body).toMatch(/<input[^>]*aria-label="Peak list file"[^>]*disabled/);
    expect(body).toMatch(/<button[^>]*disabled[^>]*>Clear spectrum<\/button>/);
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
  });
});
