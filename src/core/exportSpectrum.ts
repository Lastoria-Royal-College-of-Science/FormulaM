import { csvEscape } from "./csv";
import { computeMajorTicks, filterPeaksInRange, formatTickValue, resolvePlotDomain } from "./plotTicks";
import type { PlotSettings, SpectrumPeak, ThemeName } from "./types";

type PlotPalette = {
  background: string;
  chartBackground: string;
  axis: string;
  grid: string;
  text: string;
  mutedText: string;
  threshold: string;
  hover: string;
};

type PlotMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type SpectrumPlotRenderOptions = {
  peaks: SpectrumPeak[];
  settings: PlotSettings;
  width: number;
  height: number;
  selectedPeakId?: string | null;
  hoveredPeakId?: string | null;
  theme?: ThemeName;
  transparentBackground?: boolean;
};

function themePalette(theme: ThemeName): PlotPalette {
  return theme === "light"
    ? {
        background: "#ffffff",
        chartBackground: "#ffffff",
        axis: "#64748b",
        grid: "rgba(148, 163, 184, 0.24)",
        text: "#0f172a",
        mutedText: "#475569",
        threshold: "#b42318",
        hover: "#175cd3",
      }
    : {
        background: "#161b22",
        chartBackground: "#161b22",
        axis: "#8b949e",
        grid: "rgba(139, 148, 158, 0.18)",
        text: "#e6edf3",
        mutedText: "#8b949e",
        threshold: "#ff7b72",
        hover: "#d2a8ff",
      };
}

function plotMargins(): PlotMargins {
  return { top: 28, right: 22, bottom: 42, left: 60 };
}

export function getPlotMargins(): PlotMargins {
  return plotMargins();
}

function peakColor(peak: SpectrumPeak, settings: PlotSettings, selectedPeakId?: string | null): string {
  if (peak.id === selectedPeakId) return settings.selectedPeakColor;
  if (peak.assignments?.length) return settings.assignedPeakColor;
  return settings.peakColor;
}

function buildLabelText(peak: SpectrumPeak, settings: PlotSettings): string | null {
  if (!settings.showLabels) return null;
  if (settings.labelFilter === "assigned-only" && !peak.assignments?.length) return null;
  if (settings.labelFilter === "threshold" && (!settings.thresholdEnabled || peak.relativeIntensity < settings.thresholdPercent)) return null;

  const assignment = peak.assignments?.[0];
  if (settings.labelMode === "formula") return assignment?.formula ?? null;
  if (settings.labelMode === "mz") return peak.mz.toFixed(4);
  return assignment ? `${assignment.formula}\n${peak.mz.toFixed(4)}` : peak.mz.toFixed(4);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function resolveCoordinates(
  mz: number,
  relativeIntensity: number,
  domain: { xMin: number; xMax: number; yMax: number },
  width: number,
  height: number,
  margins: PlotMargins,
): { x: number; y: number; plotLeft: number; plotBottom: number; plotWidth: number; plotHeight: number } {
  const plotLeft = margins.left;
  const plotTop = margins.top;
  const plotWidth = Math.max(1, width - margins.left - margins.right);
  const plotHeight = Math.max(1, height - margins.top - margins.bottom);
  const plotBottom = plotTop + plotHeight;
  const xRatio = (mz - domain.xMin) / (domain.xMax - domain.xMin);
  const yRatio = relativeIntensity / domain.yMax;
  const x = plotLeft + xRatio * plotWidth;
  const y = plotBottom - yRatio * plotHeight;
  return { x, y, plotLeft, plotBottom, plotWidth, plotHeight };
}

export function renderSpectrumPlot(context: CanvasRenderingContext2D, options: SpectrumPlotRenderOptions): void {
  const { peaks, settings, width, height, selectedPeakId = null, hoveredPeakId = null, theme = "dark", transparentBackground = false } = options;
  const palette = themePalette(theme);
  const margins = plotMargins();
  const domain = resolvePlotDomain(peaks, settings);
  const visiblePeaks = filterPeaksInRange(peaks, domain.xMin, domain.xMax);
  const xTicks = computeMajorTicks(domain.xMin, domain.xMax, settings.majorTickSpacing, settings.autoTicks);
  const yTicks = computeMajorTicks(0, domain.yMax, domain.yMax / 4, false);
  const plotLeft = margins.left;
  const plotTop = margins.top;
  const plotWidth = Math.max(1, width - margins.left - margins.right);
  const plotHeight = Math.max(1, height - margins.top - margins.bottom);
  const plotBottom = plotTop + plotHeight;
  const plotRight = plotLeft + plotWidth;

  context.clearRect(0, 0, width, height);
  if (!transparentBackground) {
    context.fillStyle = palette.background;
    context.fillRect(0, 0, width, height);
  }

  context.fillStyle = palette.chartBackground;
  context.fillRect(plotLeft, plotTop, plotWidth, plotHeight);

  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  for (const tick of xTicks) {
    const { x } = resolveCoordinates(tick, 0, domain, width, height, margins);
    context.beginPath();
    context.moveTo(x, plotTop);
    context.lineTo(x, plotBottom);
    context.stroke();
  }
  for (const tick of yTicks) {
    const y = plotBottom - (tick / domain.yMax) * plotHeight;
    context.beginPath();
    context.moveTo(plotLeft, y);
    context.lineTo(plotRight, y);
    context.stroke();
  }

  if (settings.thresholdEnabled) {
    const y = plotBottom - (settings.thresholdPercent / domain.yMax) * plotHeight;
    context.save();
    context.setLineDash([6, 4]);
    context.strokeStyle = palette.threshold;
    context.beginPath();
    context.moveTo(plotLeft, y);
    context.lineTo(plotRight, y);
    context.stroke();
    context.restore();
  }

  context.save();
  context.beginPath();
  context.rect(plotLeft, plotTop, plotWidth, plotHeight);
  context.clip();
  for (const peak of visiblePeaks) {
    const { x, y } = resolveCoordinates(peak.mz, peak.relativeIntensity, domain, width, height, margins);
    context.strokeStyle = peakColor(peak, settings, selectedPeakId);
    context.lineWidth = peak.id === selectedPeakId ? Math.max(settings.lineWidth + 1.5, 2.5) : settings.lineWidth;
    context.beginPath();
    context.moveTo(x, plotBottom);
    context.lineTo(x, y);
    context.stroke();

    if (peak.id === selectedPeakId || peak.id === hoveredPeakId) {
      context.fillStyle = peak.id === selectedPeakId ? settings.selectedPeakColor : palette.hover;
      context.beginPath();
      context.arc(x, y, 3.5, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();

  context.strokeStyle = palette.axis;
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(plotLeft, plotTop);
  context.lineTo(plotLeft, plotBottom);
  context.lineTo(plotRight, plotBottom);
  context.stroke();

  context.fillStyle = palette.mutedText;
  context.font = "12px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "top";
  for (const tick of xTicks) {
    const { x } = resolveCoordinates(tick, 0, domain, width, height, margins);
    context.fillText(formatTickValue(tick, settings.majorTickSpacing), x, plotBottom + 8);
  }

  context.textAlign = "right";
  context.textBaseline = "middle";
  for (const tick of yTicks) {
    const y = plotBottom - (tick / domain.yMax) * plotHeight;
    context.fillText(formatTickValue(tick), plotLeft - 8, y);
  }

  context.fillStyle = palette.text;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.font = "600 13px Inter, system-ui, sans-serif";
  context.fillText("m/z", plotLeft + plotWidth / 2, height - 24);

  context.save();
  context.translate(18, plotTop + plotHeight / 2);
  context.rotate(-Math.PI / 2);
  context.fillText("Relative intensity (%)", 0, 0);
  context.restore();

  context.fillStyle = palette.text;
  context.font = "600 12px Inter, system-ui, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "bottom";
  const thresholdLabel = settings.thresholdEnabled ? `Threshold ${settings.thresholdPercent.toFixed(1)}%` : "Threshold off";
  context.fillText(`${visiblePeaks.length} visible peaks`, plotLeft, plotTop - 8);
  context.textAlign = "right";
  context.fillText(thresholdLabel, plotRight, plotTop - 8);

  context.font = "11px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "bottom";
  for (const peak of visiblePeaks) {
    const label = buildLabelText(peak, settings);
    if (!label) continue;
    const { x, y } = resolveCoordinates(peak.mz, peak.relativeIntensity, domain, width, height, margins);
    const lines = label.split("\n");
    lines.forEach((line, lineIndex) => {
      context.fillStyle = palette.text;
      context.fillText(line, x, Math.max(plotTop + 10, y - 8 - (lines.length - lineIndex - 1) * 14));
    });
  }
}

export function assignmentsToCsv(peaks: SpectrumPeak[], includeUnassigned = false): string {
  const headers = [
    "observed_mz",
    "intensity",
    "relative_intensity",
    "assigned_formula",
    "ion_formula",
    "predicted_mz",
    "error_da",
    "error_ppm",
  ];

  const rows = peaks
    .filter((peak) => includeUnassigned || Boolean(peak.assignments?.length))
    .map((peak) => {
      const assignment = peak.assignments?.[0];
      return [
        peak.mz.toFixed(6),
        peak.intensity.toString(),
        peak.relativeIntensity.toFixed(4),
        assignment?.formula ?? "",
        assignment?.ionFormula ?? "",
        assignment?.predictedMz?.toFixed(6) ?? "",
        assignment?.errorDa?.toFixed(6) ?? "",
        assignment?.errorPpm?.toFixed(4) ?? "",
      ];
    });

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function downloadAssignmentsCsv(peaks: SpectrumPeak[], includeUnassigned = false, filename = "spectrum_assignments.csv"): void {
  const blob = new Blob([assignmentsToCsv(peaks, includeUnassigned)], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

export async function downloadAnnotatedSpectrumPng(
  peaks: SpectrumPeak[],
  settings: PlotSettings,
  theme: ThemeName,
  filename = "annotated_spectrum.png",
  width = 1600,
  height = 900,
): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PNG export failed: Canvas rendering context is unavailable.");

  renderSpectrumPlot(context, {
    peaks,
    settings,
    width,
    height,
    theme,
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("PNG export failed: browser did not return a PNG blob."));
    }, "image/png");
  });

  downloadBlob(blob, filename);
}
