import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import PlotSettingsPanel from "../src/components/PlotSettingsPanel.svelte";
import { DEFAULT_PLOT_SETTINGS, createPlotSettings } from "../src/core/plotTicks";
import type { SpectrumPeak } from "../src/core/types";

const peaks: SpectrumPeak[] = [
  { id: "peak-1", mz: 79.2234, intensity: 40, relativeIntensity: 40 },
  { id: "peak-2", mz: 128.8695, intensity: 100, relativeIntensity: 100 },
];

describe("PlotSettingsPanel", () => {
  it("keeps field titles outside the interactive controls", () => {
    const { body } = render(PlotSettingsPanel, {
      props: {
        settings: {
          ...DEFAULT_PLOT_SETTINGS,
          xMin: 100,
          xMax: 200,
        },
        peaks,
        onChange: () => undefined,
      },
    });

    expect(body).not.toContain("<label");
    expect(body).toContain("x<sub>min</sub>");
    expect(body).toContain("x<sub>max</sub>");
    expect(body).toContain("y<sub>max</sub>");
    expect(body).not.toContain("Fixed y<sub>max</sub>");
    expect(body).toContain('aria-label="x min"');
    expect(body).toContain('aria-label="x max"');
    expect(body).toContain('aria-label="y scale"');
    expect(body).toContain('aria-label="y max"');
    expect(body).toContain('aria-label="Peak color"');
    expect(body).toContain('aria-label="Selected peak color"');
    expect(body).toContain('aria-label="Assigned peak color"');
    expect(body).toContain('aria-label="Line width"');
    expect(body).toContain('aria-label="Major tick spacing"');
    expect(body).toContain('aria-label="Threshold percent"');
    expect(body).toContain('aria-label="Label content"');
    expect(body).toContain('aria-label="Label target"');
    expect(body).toContain('value="110 (auto)"');
    expect(body).toContain('value="10 (auto)"');
    expect(body).toContain('value="33"');
    expect(body).not.toContain('value="33 (auto)"');
    expect(body).toContain('aria-label="Show threshold"');
    expect(body).toContain("i-mdi-eye-off-outline");
    expect(body).toContain(">none</option>");
    expect(body).toContain(">both</option>");
  });

  it("renders the new default plot values", () => {
    const settings = createPlotSettings(peaks);
    const { body } = render(PlotSettingsPanel, {
      props: {
        settings,
        peaks,
        onChange: () => undefined,
      },
    });

    expect(settings.xMin).toBe(70);
    expect(settings.xMax).toBe(130);
    expect(body).toContain('value="1"');
  });
});
