import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import SpectrumPlot from "../src/components/spectrum/SpectrumPlot.svelte";
import { DEFAULT_PLOT_SETTINGS } from "../src/core/plot/plotTicks";
import type { SpectrumPeak } from "../src/core/types";

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
        formula: "C6H12O6",
        ionFormula: "[C6H12O6]+",
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
    expect(body).toContain("<line");
    expect(body).toContain("<circle");
    expect(body).toContain("<tspan");
    expect(body).toContain('baseline-shift="0.38em"');
    expect(body).toContain('baseline-shift="-0.16em"');
    expect(body).not.toContain("<canvas");
  });
});
