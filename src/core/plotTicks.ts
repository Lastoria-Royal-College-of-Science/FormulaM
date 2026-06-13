import type { PlotSettings, SpectrumPeak } from "./types";

export const DEFAULT_PLOT_SETTINGS: PlotSettings = {
  yScale: "auto",
  yMax: 100,
  thresholdEnabled: false,
  thresholdPercent: 10,
  autoTicks: true,
  majorTickSpacing: undefined,
  minorTickSpacing: undefined,
  peakColor: "#79c0ff",
  selectedPeakColor: "#ffb454",
  assignedPeakColor: "#56d364",
  lineWidth: 1.5,
  showLabels: true,
  showPeakMzLabels: false,
  showFormulaLabels: true,
  labelMode: "formula",
  labelFilter: "assigned-only",
};

function niceStep(rawStep: number): number {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / magnitude;
  if (fraction <= 1) return magnitude;
  if (fraction <= 2) return 2 * magnitude;
  if (fraction <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

export function createPlotSettings(peaks: readonly SpectrumPeak[]): PlotSettings {
  const defaults = { ...DEFAULT_PLOT_SETTINGS };
  if (!peaks.length) return defaults;

  const minMz = peaks[0].mz;
  const maxMz = peaks[peaks.length - 1].mz;
  const span = maxMz - minMz || Math.max(minMz * 0.05, 1);
  const padding = Math.max(span * 0.02, 0.1);

  return {
    ...defaults,
    xMin: Math.max(0, minMz - padding),
    xMax: maxMz + padding,
  };
}

export function resolvePlotDomain(peaks: readonly SpectrumPeak[], settings: PlotSettings): { xMin: number; xMax: number; yMax: number } {
  const baseSettings = peaks.length ? createPlotSettings(peaks) : DEFAULT_PLOT_SETTINGS;
  const fallbackMin = baseSettings.xMin ?? 0;
  const fallbackMax = baseSettings.xMax ?? 1;
  let xMin = Number.isFinite(settings.xMin) ? Number(settings.xMin) : fallbackMin;
  let xMax = Number.isFinite(settings.xMax) ? Number(settings.xMax) : fallbackMax;
  if (xMax <= xMin) {
    const midpoint = (xMin + xMax) / 2 || fallbackMin;
    xMin = midpoint - 0.5;
    xMax = midpoint + 0.5;
  }

  const autoYMax = peaks.reduce((max, peak) => Math.max(max, peak.relativeIntensity), 0) || 100;
  const yMax = settings.yScale === "fixed" && Number.isFinite(settings.yMax) && Number(settings.yMax) > 0
    ? Number(settings.yMax)
    : Math.max(100, autoYMax);

  return { xMin, xMax, yMax };
}

export function computeMajorTicks(min: number, max: number, spacing?: number, autoTicks = true): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [min, max].filter(Number.isFinite);
  const resolvedSpacing = autoTicks || !spacing || spacing <= 0 ? niceStep((max - min) / 6) : spacing;
  const firstTick = Math.ceil(min / resolvedSpacing) * resolvedSpacing;
  const ticks: number[] = [];

  for (let tick = firstTick; tick <= max + resolvedSpacing * 0.5; tick += resolvedSpacing) {
    ticks.push(Number(tick.toFixed(6)));
  }

  if (!ticks.length) return [Number(min.toFixed(6)), Number(max.toFixed(6))];
  return ticks;
}

export function filterPeaksInRange(peaks: readonly SpectrumPeak[], xMin: number, xMax: number): SpectrumPeak[] {
  return peaks.filter((peak) => peak.mz >= xMin && peak.mz <= xMax);
}

export function formatTickValue(value: number, spacing?: number): string {
  if (!Number.isFinite(value)) return "";
  const decimals = spacing && spacing < 1 ? Math.min(6, Math.ceil(Math.abs(Math.log10(spacing)))) : 0;
  return value.toFixed(decimals);
}
