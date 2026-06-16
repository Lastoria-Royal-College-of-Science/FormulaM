import type { PlotSettings, SpectrumPeak } from "./types";

export const DEFAULT_PLOT_SETTINGS: PlotSettings = {
  yScale: "auto",
  yMax: 100,
  thresholdEnabled: false,
  thresholdPercent: 33,
  autoTicks: true,
  majorTickSpacing: undefined,
  minorTickSpacing: undefined,
  peakColor: "#79c0ff",
  selectedPeakColor: "#ffb454",
  assignedPeakColor: "#56d364",
  lineWidth: 1,
  showLabels: true,
  showPeakMzLabels: false,
  showFormulaLabels: true,
  labelMode: "formula",
  labelFilter: "assigned-only",
};

export type PlotAutoValues = {
  xMin: number;
  xMax: number;
  yMax: number;
  majorTickSpacing: number;
};

function floorToNearestTen(value: number): number {
  return Math.floor(value / 10) * 10;
}

function ceilToNearestTen(value: number): number {
  return Math.ceil(value / 10) * 10;
}

function resolveFallbackXDomain(peaks: readonly SpectrumPeak[]): { xMin: number; xMax: number } {
  if (!peaks.length) return { xMin: 0, xMax: 1 };

  const minMz = peaks.reduce((min, peak) => Math.min(min, peak.mz), Number.POSITIVE_INFINITY);
  const maxMz = peaks.reduce((max, peak) => Math.max(max, peak.mz), Number.NEGATIVE_INFINITY);
  if (!Number.isFinite(minMz) || !Number.isFinite(maxMz)) return { xMin: 0, xMax: 1 };

  const xMin = Math.max(0, floorToNearestTen(minMz));
  let xMax = ceilToNearestTen(maxMz);
  if (xMax <= xMin) xMax = xMin + 10;
  return { xMin, xMax };
}

function resolveXDomain(peaks: readonly SpectrumPeak[], settings: PlotSettings): { xMin: number; xMax: number } {
  const fallback = resolveFallbackXDomain(peaks);
  let xMin = Number.isFinite(settings.xMin) ? Number(settings.xMin) : fallback.xMin;
  let xMax = Number.isFinite(settings.xMax) ? Number(settings.xMax) : fallback.xMax;
  if (xMax <= xMin) {
    const midpoint = (xMin + xMax) / 2 || fallback.xMin;
    xMin = midpoint - 0.5;
    xMax = midpoint + 0.5;
  }
  return { xMin, xMax };
}

export function createPlotSettings(peaks: readonly SpectrumPeak[]): PlotSettings {
  const defaults = { ...DEFAULT_PLOT_SETTINGS };
  if (!peaks.length) return defaults;
  const { xMin, xMax } = resolveFallbackXDomain(peaks);

  return {
    ...defaults,
    xMin,
    xMax,
  };
}

export function resolveAutoYMax(peaks: readonly SpectrumPeak[], xMin: number, xMax: number): number {
  const localMax = filterPeaksInRange(peaks, xMin, xMax).reduce((max, peak) => Math.max(max, peak.relativeIntensity), 0);
  return localMax > 0 ? localMax * 1.1 : 100;
}

export function computeAutoMajorTickSpacing(min: number, max: number): number {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 1;
  const range = max - min;
  let tickSpacing = 10 ** Math.ceil(Math.log10(range) - 1);
  const ticks = range / tickSpacing;
  if (ticks < 2) {
    tickSpacing /= 5;
  } else if (ticks < 5) {
    tickSpacing /= 2;
  }
  return tickSpacing;
}

export function resolveMajorTickSpacing(min: number, max: number, spacing?: number, autoTicks = true): number {
  if (autoTicks || !spacing || spacing <= 0) return computeAutoMajorTickSpacing(min, max);
  return spacing;
}

export function resolveThresholdPercent(settings: PlotSettings): number {
  return Number.isFinite(settings.thresholdPercent)
    ? Math.min(100, Math.max(0, Number(settings.thresholdPercent)))
    : DEFAULT_PLOT_SETTINGS.thresholdPercent;
}

export function resolvePlotAutoValues(peaks: readonly SpectrumPeak[], settings: PlotSettings): PlotAutoValues {
  const { xMin, xMax } = resolveXDomain(peaks, settings);
  return {
    xMin,
    xMax,
    yMax: resolveAutoYMax(peaks, xMin, xMax),
    majorTickSpacing: computeAutoMajorTickSpacing(xMin, xMax),
  };
}

export function resolvePlotDomain(peaks: readonly SpectrumPeak[], settings: PlotSettings): { xMin: number; xMax: number; yMax: number } {
  const { xMin, xMax } = resolveXDomain(peaks, settings);
  const autoYMax = resolveAutoYMax(peaks, xMin, xMax);
  const yMax = settings.yScale === "fixed" && Number.isFinite(settings.yMax) && Number(settings.yMax) > 0
    ? Number(settings.yMax)
    : autoYMax;

  return { xMin, xMax, yMax };
}

export function computeMajorTicks(min: number, max: number, spacing?: number, autoTicks = true): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [min, max].filter(Number.isFinite);
  const resolvedSpacing = resolveMajorTickSpacing(min, max, spacing, autoTicks);
  const firstTick = Math.ceil(min / resolvedSpacing) * resolvedSpacing;
  const ticks: number[] = [];

  for (let tick = firstTick; tick <= max + resolvedSpacing * 0.5; tick += resolvedSpacing) {
    ticks.push(Number(tick.toFixed(6)));
  }

  if (!ticks.length) return [Number(min.toFixed(6)), Number(max.toFixed(6))];
  return ticks;
}

export function computeMinorTicks(min: number, max: number, majorSpacing: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || !Number.isFinite(majorSpacing) || majorSpacing <= 0) return [];
  const spacing = majorSpacing / 10;
  const resolution = spacing * 1e-6;
  const ticks: number[] = [];

  for (let tick = min; tick <= max + resolution; tick += spacing) {
    ticks.push(Number(tick.toFixed(6)));
  }

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
