import { readFileSync } from "node:fs";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import SpectrumPlot from "../../src/components/spectrum/SpectrumPlot.svelte";
import { DEFAULT_PLOT_SETTINGS } from "../../src/core/plot/plotTicks";
import type { SpectrumPeak } from "../../src/core/types";
import { enabledInteractiveControlsWithTitles } from "./titleAssertions";

const peaks: SpectrumPeak[] = [
  {
    id: "peak-1",
    mz: 100.1,
    intensity: 500,
    relativeIntensity: 100,
    assignments: [
      {
        peakId: "peak-1",
        mz: 100.1,
        intensity: 500,
        relativeIntensity: 100,
        formula: "C5[13C]H12O6",
        ionFormula: "[C5[13C]H12O6]2+",
        source: "manual",
      },
    ],
  },
  {
    id: "peak-2",
    mz: 101.25,
    intensity: 200,
    relativeIntensity: 40,
  },
];

const spectrumPlotSource = readFileSync(
  new URL("../../src/components/spectrum/SpectrumPlot.svelte", import.meta.url),
  "utf8",
);

describe("SpectrumPlot", () => {
  it("renders the interactive spectrum as native SVG instead of canvas", () => {
    const { body } = render(SpectrumPlot, {
      props: {
        peaks,
        settings: {
          ...DEFAULT_PLOT_SETTINGS,
          xMin: 99.5,
          xMax: 102,
        },
        selectedPeakId: "peak-1",
        onSelectPeak: () => undefined,
        onResetView: () => undefined,
      },
    });

    expect(body).toContain("<svg");
    expect(body).toContain('aria-label="Spectrum plot.');
    expect(body).toContain("spectrum-plot-frame");
    expect(body).not.toContain("spectrum-plot-button");
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
    expect(body).toContain("<line");
    expect(body).toContain("<circle");
    expect(body).toContain("<tspan");
    expect(body).toContain('baseline-shift="0.38em"');
    expect(body).toContain('baseline-shift="-0.16em"');
    expect(body).not.toContain('dx="1.98"');
    expect(body).not.toContain("[13C]");
    expect(body).not.toContain("<canvas");
  });

  it("does not add a custom hover border to the plot frame", () => {
    expect(spectrumPlotSource).not.toContain("spectrum-plot-button");
    expect(spectrumPlotSource).not.toContain(".spectrum-plot-button:hover");
    expect(spectrumPlotSource).toContain(".spectrum-plot-frame:enabled:hover");
    expect(spectrumPlotSource).toContain("border-color: var(--border);");
    expect(spectrumPlotSource).toContain("box-shadow: none;");
    expect(spectrumPlotSource).toContain("filter: none;");
    expect(spectrumPlotSource).not.toContain("border-color: var(--accent);");
  });

  it("explains why reset is disabled before a spectrum is imported", () => {
    const { body } = render(SpectrumPlot, {
      props: {
        peaks: [],
        settings: DEFAULT_PLOT_SETTINGS,
        onSelectPeak: () => undefined,
        onResetView: () => undefined,
      },
    });

    expect(body).toContain('title="Import a spectrum before resetting the view."');
    expect(body).toContain("disabled");
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
  });
});
