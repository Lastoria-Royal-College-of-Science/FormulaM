import { describe, expect, it } from "vitest";
import { attachAssignmentsToPeaks, buildPeakAssignment, upsertAssignment } from "../src/core/assignments";
import { annotatedSpectrumPdfBytes, assignmentsToCsv, createSpectrumPlotScene } from "../src/core/exportSpectrum";
import { DEFAULT_PLOT_SETTINGS, computeAutoMajorTickSpacing, computeMinorTicks, createPlotSettings, resolvePlotDomain } from "../src/core/plotTicks";
import { loadSpectrumImportSource, parseCsvText } from "../src/core/spectrumImport";
import { buildSpectrumPreview, normalizeSpectrumTable } from "../src/core/spectrumNormalize";
import type { FormulaHit, SpectrumPeak } from "../src/core/types";

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

describe("spectrum plot settings", () => {
  const peaks: SpectrumPeak[] = [
    { id: "peak-1", mz: 79.2234, intensity: 50, relativeIntensity: 50 },
    { id: "peak-2", mz: 101.4, intensity: 100, relativeIntensity: 100 },
    { id: "peak-3", mz: 128.8695, intensity: 20, relativeIntensity: 20 },
  ];

  it("defaults x limits to the nearest enclosing tens", () => {
    const settings = createPlotSettings(peaks);

    expect(settings.xMin).toBe(70);
    expect(settings.xMax).toBe(130);
    expect(settings.lineWidth).toBe(1);
    expect(settings.thresholdPercent).toBe(33);
  });

  it("auto-scales yMax from the visible x range only", () => {
    const domain = resolvePlotDomain(peaks, {
      ...DEFAULT_PLOT_SETTINGS,
      xMin: 120,
      xMax: 130,
    });

    expect(domain.yMax).toBeCloseTo(22);
  });

  it("uses the requested automatic major tick spacing logic", () => {
    expect(computeAutoMajorTickSpacing(70, 130)).toBe(10);
    expect(computeAutoMajorTickSpacing(0, 40)).toBe(5);
    expect(computeAutoMajorTickSpacing(0, 15)).toBe(2);
  });

  it("places x-axis minor ticks at one tenth of the major spacing", () => {
    const ticks = computeMinorTicks(70, 72, 10);

    expect(ticks).toEqual([70, 71, 72]);
  });

  it("labels threshold-filtered peaks even when the threshold guide is off", () => {
    const scene = createSpectrumPlotScene({
      peaks,
      settings: {
        ...DEFAULT_PLOT_SETTINGS,
        xMin: 70,
        xMax: 130,
        thresholdEnabled: false,
        labelMode: "mz",
        labelFilter: "threshold",
      },
      width: 800,
      height: 450,
      theme: "light",
    });

    const text = scene.shapes.filter((shape) => shape.kind === "text").map((shape) => shape.text);

    expect(text).toContain("79.2234");
    expect(text).toContain("101.4000");
    expect(text).not.toContain("128.8695");
    expect(scene.shapes.some((shape) => shape.kind === "line" && Boolean(shape.dash?.length))).toBe(false);
  });

  it("omits threshold guide lines and labels from exported plot scenes", () => {
    const scene = createSpectrumPlotScene({
      peaks,
      settings: {
        ...DEFAULT_PLOT_SETTINGS,
        thresholdEnabled: true,
        thresholdPercent: 15,
      },
      width: 800,
      height: 450,
      theme: "light",
      renderMode: "export",
    });

    const text = scene.shapes.filter((shape) => shape.kind === "text").map((shape) => shape.text);

    expect(scene.shapes.some((shape) => shape.kind === "line" && Boolean(shape.dash?.length))).toBe(false);
    expect(text.some((value) => value.startsWith("Threshold"))).toBe(false);
  });

  it("dims peaks below the threshold only when threshold display is enabled", () => {
    const scene = createSpectrumPlotScene({
      peaks,
      settings: {
        ...DEFAULT_PLOT_SETTINGS,
        xMin: 70,
        xMax: 130,
        thresholdEnabled: true,
        thresholdPercent: 33,
      },
      width: 800,
      height: 450,
      theme: "light",
    });

    const peakLines = scene.shapes.filter((shape) => shape.kind === "line" && !shape.dash?.length && shape.y2 < shape.y1);

    expect(scene.shapes.some((shape) => shape.kind === "line" && Boolean(shape.dash?.length))).toBe(true);
    expect(peakLines.some((shape) => shape.kind === "line" && shape.opacity === 0.32)).toBe(true);
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

  it("builds an annotated vector PDF export for the current spectrum view", () => {
    const imported = normalizeSpectrumTable(parseCsvText("mz,intensity\n180.063388,1000\n181.000000,50\n"), "assign.pdf.csv");
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
    const pdf = new TextDecoder().decode(
      annotatedSpectrumPdfBytes(
        decoratedPeaks,
        {
          ...DEFAULT_PLOT_SETTINGS,
          thresholdEnabled: true,
          thresholdPercent: 15,
        },
        "light",
        800,
        450,
      ),
    );

    expect(pdf).toContain("%PDF-1.4");
    expect(pdf).toContain("/BaseFont /Helvetica");
    expect(pdf).toContain("(2 visible peaks) Tj");
    expect(pdf).not.toContain("Threshold");
    expect(pdf).toContain("(C6H12O6) Tj");
  });

  it("uses a transparent export scene with black axes and axis labels", () => {
    const imported = normalizeSpectrumTable(parseCsvText("mz,intensity\n180.063388,1000\n181.000000,50\n"), "export-style.csv");
    const scene = createSpectrumPlotScene({
      peaks: imported.peaks,
      settings: {
        ...DEFAULT_PLOT_SETTINGS,
        thresholdEnabled: true,
        thresholdPercent: 15,
      },
      width: 800,
      height: 450,
      theme: "dark",
      renderMode: "export",
      transparentBackground: true,
    });

    const rootRect = scene.shapes.find(
      (shape) => shape.kind === "rect" && shape.x === 0 && shape.y === 0 && shape.width === 800 && shape.height === 450,
    );
    const axisTitle = scene.shapes.find((shape) => shape.kind === "text" && shape.text === "m/z");
    const axisLine = scene.shapes.find((shape) => shape.kind === "line" && shape.stroke === "#000000");

    expect(rootRect).toBeUndefined();
    expect(axisTitle?.kind).toBe("text");
    if (axisTitle?.kind === "text") expect(axisTitle.fill).toBe("#000000");
    expect(axisLine?.kind).toBe("line");
    if (axisLine?.kind === "line") expect(axisLine.stroke).toBe("#000000");
  });
});
