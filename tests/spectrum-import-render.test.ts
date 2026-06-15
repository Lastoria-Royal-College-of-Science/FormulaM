import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import SpectrumImport from "../src/components/SpectrumImport.svelte";

describe("SpectrumImport", () => {
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
});
