import { describe, expect, it } from "vitest";
import { attachAssignmentsToPeaks, buildPeakAssignment, upsertAssignment } from "../src/core/assignments";
import { assignmentsToCsv } from "../src/core/exportSpectrum";
import { loadSpectrumImportSource, parseCsvText } from "../src/core/spectrumImport";
import { buildSpectrumPreview, normalizeSpectrumTable } from "../src/core/spectrumNormalize";
import type { FormulaHit } from "../src/core/types";

describe("spectrum import", () => {
  it("normalizes m/z and intensity aliases, sorts peaks, and computes relative intensity", () => {
    const imported = normalizeSpectrumTable(
      parseCsvText("M/Z,Abund,Comment\n100.125,25,first\n99.5,50,second\nbad,12,ignored\n"),
      "example.csv",
    );

    expect(imported.mzColumn).toBe("M/Z");
    expect(imported.intensityColumn).toBe("Abund");
    expect(imported.peaks).toHaveLength(2);
    expect(imported.peaks[0].mz).toBe(99.5);
    expect(imported.peaks[0].relativeIntensity).toBeCloseTo(100);
    expect(imported.peaks[1].relativeIntensity).toBeCloseTo(50);
  });

  it("fails with a clear error when the intensity column is missing", () => {
    expect(() => normalizeSpectrumTable(parseCsvText("mz,formula_name\n120.1,glucose\n"), "missing-intensity.csv")).toThrow(
      /select the intensity/i,
    );
  });

  it("builds numeric preview headers and supports manual column selection without a header row", () => {
    const table = parseCsvText("sample-a,180.063388,1500\nsample-b,181.000000,200\n");
    const preview = buildSpectrumPreview(table, false);
    const imported = normalizeSpectrumTable(table, {
      sourceName: "manual-columns.csv",
      hasHeaderRow: false,
      mzColumnIndex: 1,
      intensityColumnIndex: 2,
    });

    expect(preview.columnLabels).toEqual(["1", "2", "3"]);
    expect(preview.rows[0]).toEqual(["sample-a", "180.063388", "1500"]);
    expect(imported.mzColumn).toBe("2");
    expect(imported.intensityColumn).toBe("3");
    expect(imported.peaks).toHaveLength(2);
    expect(imported.peaks[0].mz).toBeCloseTo(180.063388);
  });

  it("loads all worksheets from an xlsx workbook for sheet switching", async () => {
    const xlsx = await import("xlsx");
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet([["mz", "intensity"], [100, 20]]), "SheetA");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet([["m/z", "Abund"], [200, 50]]), "SheetB");

    const workbookBytes = xlsx.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const file = new File([workbookBytes], "multi-sheet.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const source = await loadSpectrumImportSource(file);

    expect(source.sheets.map((sheet) => sheet.name)).toEqual(["SheetA", "SheetB"]);
    expect(source.sheets[1].suggestedMzColumnIndex).toBe(0);
    expect(source.sheets[1].suggestedIntensityColumnIndex).toBe(1);
  });
});

describe("assignment export", () => {
  it("exports assigned peaks into the spectrum assignment csv", () => {
    const imported = normalizeSpectrumTable(parseCsvText("mz,intensity\n180.063388,1000\n181.000000,50\n"), "assign.csv");
    const hit: FormulaHit = {
      formula: "C6H12O6",
      composition: { C: 6, H: 12, O: 6 },
      mass: "180.063388104",
      mz: "180.063388104",
      error_da: "0.000000104",
      error_ppm: "0.000577",
      charge: 1,
      charge_state: "1+",
      ion_formula: "[C6H12O6]+",
    };

    const assignments = upsertAssignment([], buildPeakAssignment(imported.peaks[0], hit));
    const decoratedPeaks = attachAssignmentsToPeaks(imported.peaks, assignments, imported.peaks[0].id);
    const csv = assignmentsToCsv(decoratedPeaks);

    expect(csv).toContain("observed_mz,intensity,relative_intensity,assigned_formula");
    expect(csv).toContain("180.063388");
    expect(csv).toContain("C6H12O6");
    expect(csv.split("\n")).toHaveLength(2);
  });
});
