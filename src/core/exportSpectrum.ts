import { csvEscape } from "./csv";
import { computeMajorTicks, computeMinorTicks, filterPeaksInRange, formatTickValue, resolveMajorTickSpacing, resolvePlotDomain, resolveThresholdPercent } from "./plotTicks";
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
  renderMode?: "screen" | "export";
  transparentBackground?: boolean;
};

export type PlotRect = {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

export type PlotLine = {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  opacity?: number;
};

export type PlotCircle = {
  kind: "circle";
  x: number;
  y: number;
  radius: number;
  fill: string;
};

export type PlotText = {
  kind: "text";
  x: number;
  y: number;
  text: string;
  fill: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  align: CanvasTextAlign;
  baseline: CanvasTextBaseline;
  rotation?: number;
};

export type PlotShape = PlotRect | PlotLine | PlotCircle | PlotText;

export type PlotScene = {
  width: number;
  height: number;
  pageBackground: string;
  shapes: PlotShape[];
};

type PdfTextMetrics = {
  width: number;
  ascent: number;
  descent: number;
};

const CANVAS_FONT_FAMILY = "Inter, system-ui, sans-serif";
const PDF_FONT_FAMILY = "Helvetica, Arial, sans-serif";

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

function exportPalette(): PlotPalette {
  return {
    background: "#ffffff",
    chartBackground: "#ffffff",
    axis: "#000000",
    grid: "rgba(148, 163, 184, 0.24)",
    text: "#000000",
    mutedText: "#000000",
    threshold: "#b42318",
    hover: "#175cd3",
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

function peakOpacity(peak: SpectrumPeak, settings: PlotSettings): number {
  return settings.thresholdEnabled && peak.relativeIntensity < resolveThresholdPercent(settings) ? 0.32 : 1;
}

function buildLabelText(peak: SpectrumPeak, settings: PlotSettings): string | null {
  if (!settings.showLabels) return null;
  if (settings.labelFilter === "none") return null;

  const hasAssignment = Boolean(peak.assignments?.length);
  const isThresholdPeak = peak.relativeIntensity >= resolveThresholdPercent(settings);
  if (settings.labelFilter === "assigned-only" && !hasAssignment) return null;
  if (settings.labelFilter === "threshold" && !isThresholdPeak) return null;
  if (settings.labelFilter === "both" && !hasAssignment && !isThresholdPeak) return null;

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

export function createSpectrumPlotScene(options: SpectrumPlotRenderOptions): PlotScene {
  const { peaks, settings, width, height, selectedPeakId = null, hoveredPeakId = null, theme = "dark", renderMode = "screen", transparentBackground = false } = options;
  const palette = renderMode === "export" ? exportPalette() : themePalette(theme);
  const margins = plotMargins();
  const domain = resolvePlotDomain(peaks, settings);
  const visiblePeaks = filterPeaksInRange(peaks, domain.xMin, domain.xMax);
  const xTickSpacing = resolveMajorTickSpacing(domain.xMin, domain.xMax, settings.majorTickSpacing, settings.autoTicks);
  const thresholdPercent = resolveThresholdPercent(settings);
  const xTicks = computeMajorTicks(domain.xMin, domain.xMax, xTickSpacing, false);
  const xMinorTicks = computeMinorTicks(domain.xMin, domain.xMax, xTickSpacing);
  const yTicks = computeMajorTicks(0, domain.yMax, domain.yMax / 4, false);
  const plotLeft = margins.left;
  const plotTop = margins.top;
  const plotWidth = Math.max(1, width - margins.left - margins.right);
  const plotHeight = Math.max(1, height - margins.top - margins.bottom);
  const plotBottom = plotTop + plotHeight;
  const plotRight = plotLeft + plotWidth;
  const shapes: PlotShape[] = [];

  if (!transparentBackground) {
    shapes.push({
      kind: "rect",
      x: 0,
      y: 0,
      width,
      height,
      fill: palette.background,
    });
  }

  if (renderMode === "screen") {
    shapes.push({
      kind: "rect",
      x: plotLeft,
      y: plotTop,
      width: plotWidth,
      height: plotHeight,
      fill: palette.chartBackground,
    });
  }

  for (const tick of xTicks) {
    const { x } = resolveCoordinates(tick, 0, domain, width, height, margins);
    shapes.push({
      kind: "line",
      x1: x,
      y1: plotTop,
      x2: x,
      y2: plotBottom,
      stroke: palette.grid,
      strokeWidth: 1,
    });
  }
  for (const tick of yTicks) {
    const y = plotBottom - (tick / domain.yMax) * plotHeight;
    shapes.push({
      kind: "line",
      x1: plotLeft,
      y1: y,
      x2: plotRight,
      y2: y,
      stroke: palette.grid,
      strokeWidth: 1,
    });
  }

  if (renderMode === "screen" && settings.thresholdEnabled) {
    const y = plotBottom - (thresholdPercent / domain.yMax) * plotHeight;
    shapes.push({
      kind: "line",
      x1: plotLeft,
      y1: y,
      x2: plotRight,
      y2: y,
      stroke: palette.threshold,
      strokeWidth: 1,
      dash: [6, 4],
    });
  }

  for (const tick of xMinorTicks) {
    const { x } = resolveCoordinates(tick, 0, domain, width, height, margins);
    shapes.push({
      kind: "line",
      x1: x,
      y1: plotBottom,
      x2: x,
      y2: plotBottom + 5,
      stroke: palette.axis,
      strokeWidth: 0.75,
    });
  }

  for (const peak of visiblePeaks) {
    const { x, y } = resolveCoordinates(peak.mz, peak.relativeIntensity, domain, width, height, margins);
    const clampedY = Math.max(plotTop, y);
    shapes.push({
      kind: "line",
      x1: x,
      y1: plotBottom,
      x2: x,
      y2: clampedY,
      stroke: peakColor(peak, settings, selectedPeakId),
      strokeWidth: peak.id === selectedPeakId ? Math.max(settings.lineWidth + 1.5, 2.5) : settings.lineWidth,
      opacity: peakOpacity(peak, settings),
    });

    if (peak.id === selectedPeakId || peak.id === hoveredPeakId) {
      shapes.push({
        kind: "circle",
        x,
        y: clampedY,
        radius: 3.5,
        fill: peak.id === selectedPeakId ? settings.selectedPeakColor : palette.hover,
      });
    }
  }

  shapes.push({
    kind: "line",
    x1: plotLeft,
    y1: plotTop,
    x2: plotLeft,
    y2: plotBottom,
    stroke: palette.axis,
    strokeWidth: 1.25,
  });
  shapes.push({
    kind: "line",
    x1: plotLeft,
    y1: plotBottom,
    x2: plotRight,
    y2: plotBottom,
    stroke: palette.axis,
    strokeWidth: 1.25,
  });

  for (const tick of xTicks) {
    const { x } = resolveCoordinates(tick, 0, domain, width, height, margins);
    shapes.push({
      kind: "text",
      x,
      y: plotBottom + 8,
      text: formatTickValue(tick, xTickSpacing),
      fill: palette.mutedText,
      fontSize: 12,
      fontWeight: "normal",
      align: "center",
      baseline: "top",
    });
  }

  for (const tick of yTicks) {
    const y = plotBottom - (tick / domain.yMax) * plotHeight;
    shapes.push({
      kind: "text",
      x: plotLeft - 8,
      y,
      text: formatTickValue(tick),
      fill: palette.mutedText,
      fontSize: 12,
      fontWeight: "normal",
      align: "right",
      baseline: "middle",
    });
  }

  const thresholdLabel = `Threshold ${thresholdPercent.toFixed(1)}%`;
  shapes.push({
    kind: "text",
    x: plotLeft + plotWidth / 2,
    y: height - 24,
    text: "m/z",
    fill: palette.text,
    fontSize: 13,
    fontWeight: "bold",
    align: "center",
    baseline: "top",
  });
  shapes.push({
    kind: "text",
    x: 18,
    y: plotTop + plotHeight / 2,
    text: "Relative intensity (%)",
    fill: palette.text,
    fontSize: 13,
    fontWeight: "bold",
    align: "center",
    baseline: "middle",
    rotation: -90,
  });
  shapes.push({
    kind: "text",
    x: plotLeft,
    y: plotTop - 8,
    text: `${visiblePeaks.length} visible peaks`,
    fill: palette.text,
    fontSize: 12,
    fontWeight: "bold",
    align: "left",
    baseline: "bottom",
  });
  if (renderMode === "screen" && settings.thresholdEnabled) {
    shapes.push({
      kind: "text",
      x: plotRight,
      y: plotTop - 8,
      text: thresholdLabel,
      fill: palette.text,
      fontSize: 12,
      fontWeight: "bold",
      align: "right",
      baseline: "bottom",
    });
  }

  for (const peak of visiblePeaks) {
    const label = buildLabelText(peak, settings);
    if (!label) continue;
    const { x, y } = resolveCoordinates(peak.mz, peak.relativeIntensity, domain, width, height, margins);
    const lines = label.split("\n");
    lines.forEach((line, lineIndex) => {
      shapes.push({
        kind: "text",
        x,
        y: Math.max(plotTop + 10, y - 8 - (lines.length - lineIndex - 1) * 14),
        text: line,
        fill: palette.text,
        fontSize: 11,
        fontWeight: "normal",
        align: "center",
        baseline: "bottom",
      });
    });
  }

  return {
    width,
    height,
    pageBackground: palette.background,
    shapes,
  };
}

function renderPlotScene(context: CanvasRenderingContext2D, scene: PlotScene): void {
  context.clearRect(0, 0, scene.width, scene.height);

  for (const shape of scene.shapes) {
    if (shape.kind === "rect") {
      context.fillStyle = shape.fill;
      context.fillRect(shape.x, shape.y, shape.width, shape.height);
      continue;
    }

    if (shape.kind === "line") {
      context.save();
      context.globalAlpha = shape.opacity ?? 1;
      context.strokeStyle = shape.stroke;
      context.lineWidth = shape.strokeWidth;
      context.setLineDash(shape.dash ?? []);
      context.beginPath();
      context.moveTo(shape.x1, shape.y1);
      context.lineTo(shape.x2, shape.y2);
      context.stroke();
      context.restore();
      continue;
    }

    if (shape.kind === "circle") {
      context.fillStyle = shape.fill;
      context.beginPath();
      context.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      context.fill();
      continue;
    }

    context.save();
    context.fillStyle = shape.fill;
    context.font = `${shape.fontWeight === "bold" ? 600 : 400} ${shape.fontSize}px ${CANVAS_FONT_FAMILY}`;
    context.textAlign = shape.align;
    context.textBaseline = shape.baseline;

    if (shape.rotation) {
      context.translate(shape.x, shape.y);
      context.rotate((shape.rotation * Math.PI) / 180);
      context.fillText(shape.text, 0, 0);
    } else {
      context.fillText(shape.text, shape.x, shape.y);
    }

    context.restore();
  }
}

export function renderSpectrumPlot(context: CanvasRenderingContext2D, options: SpectrumPlotRenderOptions): void {
  renderPlotScene(context, createSpectrumPlotScene(options));
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

  renderPlotScene(context, createSpectrumPlotScene({
    peaks,
    settings,
    width,
    height,
    theme,
    renderMode: "export",
    transparentBackground: true,
  }));

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("PNG export failed: browser did not return a PNG blob."));
    }, "image/png");
  });

  downloadBlob(blob, filename);
}

function formatPdfNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number(value.toFixed(4)).toString();
}

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  const normalized = color.trim();

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    if (hex.length === 3) {
      const [r, g, b] = hex.split("").map((token) => Number.parseInt(token.repeat(2), 16));
      return { r, g, b, a: 1 };
    }

    if (hex.length === 6) {
      return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
  }

  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const tokens = rgbMatch[1].split(",").map((token) => token.trim());
    const [r, g, b] = tokens.slice(0, 3).map((token) => Number(token));
    const alpha = tokens[3] === undefined ? 1 : Number(tokens[3]);
    return {
      r: clampByte(r),
      g: clampByte(g),
      b: clampByte(b),
      a: Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 1,
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

function resolvePdfColor(color: string, background: string, opacity = 1): { r: number; g: number; b: number } {
  const foreground = parseColor(color);
  const alpha = Math.min(1, Math.max(0, foreground.a * opacity));
  if (alpha >= 1) {
    return { r: foreground.r, g: foreground.g, b: foreground.b };
  }

  const base = parseColor(background);
  return {
    r: clampByte(foreground.r * alpha + base.r * (1 - alpha)),
    g: clampByte(foreground.g * alpha + base.g * (1 - alpha)),
    b: clampByte(foreground.b * alpha + base.b * (1 - alpha)),
  };
}

function pdfColorCommand(color: string, background: string, opacity = 1): string {
  const resolved = resolvePdfColor(color, background, opacity);
  return [
    formatPdfNumber(resolved.r / 255),
    formatPdfNumber(resolved.g / 255),
    formatPdfNumber(resolved.b / 255),
  ].join(" ");
}

let pdfMeasurementContext: CanvasRenderingContext2D | null | undefined;

function getPdfMeasurementContext(): CanvasRenderingContext2D | null {
  if (pdfMeasurementContext !== undefined) return pdfMeasurementContext;
  if (typeof document === "undefined") {
    pdfMeasurementContext = null;
    return pdfMeasurementContext;
  }

  const canvas = document.createElement("canvas");
  pdfMeasurementContext = canvas.getContext("2d");
  return pdfMeasurementContext;
}

function measurePdfText(text: string, fontSize: number, fontWeight: PlotText["fontWeight"]): PdfTextMetrics {
  const context = getPdfMeasurementContext();
  if (!context) {
    return {
      width: text.length * fontSize * 0.6,
      ascent: fontSize * 0.8,
      descent: fontSize * 0.2,
    };
  }

  context.font = `${fontWeight === "bold" ? 700 : 400} ${fontSize}px ${PDF_FONT_FAMILY}`;
  const metrics = context.measureText(text);
  return {
    width: metrics.width || text.length * fontSize * 0.6,
    ascent: metrics.actualBoundingBoxAscent || fontSize * 0.8,
    descent: metrics.actualBoundingBoxDescent || fontSize * 0.2,
  };
}

function escapePdfText(text: string): string {
  return text
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function textAlignOffset(width: number, align: CanvasTextAlign): number {
  if (align === "center") return -width / 2;
  if (align === "right" || align === "end") return -width;
  return 0;
}

function textBaselineOffset(metrics: PdfTextMetrics, baseline: CanvasTextBaseline): number {
  if (baseline === "top" || baseline === "hanging") return metrics.ascent;
  if (baseline === "middle") return (metrics.ascent - metrics.descent) / 2;
  if (baseline === "bottom" || baseline === "ideographic") return -metrics.descent;
  return 0;
}

function buildPdfText(shape: PlotText, scene: PlotScene): string {
  const metrics = measurePdfText(shape.text, shape.fontSize, shape.fontWeight);
  const xOffset = textAlignOffset(metrics.width, shape.align);
  const yOffset = textBaselineOffset(metrics, shape.baseline);
  const canvasRotation = ((shape.rotation ?? 0) * Math.PI) / 180;
  const baselineX = shape.x + xOffset * Math.cos(canvasRotation) - yOffset * Math.sin(canvasRotation);
  const baselineY = shape.y + xOffset * Math.sin(canvasRotation) + yOffset * Math.cos(canvasRotation);
  const pdfRotation = -canvasRotation;
  const cosine = Math.cos(pdfRotation);
  const sine = Math.sin(pdfRotation);
  const fontName = shape.fontWeight === "bold" ? "/F2" : "/F1";

  return [
    "q",
    "BT",
    `${fontName} ${formatPdfNumber(shape.fontSize)} Tf`,
    `${pdfColorCommand(shape.fill, scene.pageBackground)} rg`,
    [
      formatPdfNumber(cosine),
      formatPdfNumber(sine),
      formatPdfNumber(-sine),
      formatPdfNumber(cosine),
      formatPdfNumber(baselineX),
      formatPdfNumber(scene.height - baselineY),
      "Tm",
    ].join(" "),
    `(${escapePdfText(shape.text)}) Tj`,
    "ET",
    "Q",
  ].join("\n");
}

function buildPdfCircle(shape: PlotCircle, scene: PlotScene): string {
  const c = shape.radius * 0.552284749831;
  const x = shape.x;
  const y = shape.y;
  const top = scene.height - (y - shape.radius);
  const bottom = scene.height - (y + shape.radius);
  const centerY = scene.height - y;

  return [
    "q",
    `${pdfColorCommand(shape.fill, scene.pageBackground)} rg`,
    `${formatPdfNumber(x + shape.radius)} ${formatPdfNumber(centerY)} m`,
    [
      formatPdfNumber(x + shape.radius),
      formatPdfNumber(scene.height - (y + c)),
      formatPdfNumber(x + c),
      formatPdfNumber(bottom),
      formatPdfNumber(x),
      formatPdfNumber(bottom),
      "c",
    ].join(" "),
    [
      formatPdfNumber(x - c),
      formatPdfNumber(bottom),
      formatPdfNumber(x - shape.radius),
      formatPdfNumber(scene.height - (y + c)),
      formatPdfNumber(x - shape.radius),
      formatPdfNumber(centerY),
      "c",
    ].join(" "),
    [
      formatPdfNumber(x - shape.radius),
      formatPdfNumber(scene.height - (y - c)),
      formatPdfNumber(x - c),
      formatPdfNumber(top),
      formatPdfNumber(x),
      formatPdfNumber(top),
      "c",
    ].join(" "),
    [
      formatPdfNumber(x + c),
      formatPdfNumber(top),
      formatPdfNumber(x + shape.radius),
      formatPdfNumber(scene.height - (y - c)),
      formatPdfNumber(x + shape.radius),
      formatPdfNumber(centerY),
      "c",
    ].join(" "),
    "f",
    "Q",
  ].join("\n");
}

function buildPdfShape(shape: PlotShape, scene: PlotScene): string {
  if (shape.kind === "rect") {
    return [
      "q",
      `${pdfColorCommand(shape.fill, scene.pageBackground)} rg`,
      [
        formatPdfNumber(shape.x),
        formatPdfNumber(scene.height - shape.y - shape.height),
        formatPdfNumber(shape.width),
        formatPdfNumber(shape.height),
        "re",
        "f",
      ].join(" "),
      "Q",
    ].join("\n");
  }

  if (shape.kind === "line") {
    return [
      "q",
      `${pdfColorCommand(shape.stroke, scene.pageBackground, shape.opacity ?? 1)} RG`,
      `${formatPdfNumber(shape.strokeWidth)} w`,
      `${shape.dash?.length ? `[${shape.dash.map(formatPdfNumber).join(" ")}]` : "[]"} 0 d`,
      `${formatPdfNumber(shape.x1)} ${formatPdfNumber(scene.height - shape.y1)} m`,
      `${formatPdfNumber(shape.x2)} ${formatPdfNumber(scene.height - shape.y2)} l`,
      "S",
      "Q",
    ].join("\n");
  }

  if (shape.kind === "circle") {
    return buildPdfCircle(shape, scene);
  }

  return buildPdfText(shape, scene);
}

function buildPdfDocument(scene: PlotScene): Uint8Array {
  const encoder = new TextEncoder();
  const stream = `${scene.shapes.map((shape) => buildPdfShape(shape, scene)).join("\n")}\n`;
  const streamLength = encoder.encode(stream).length;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    [
      "3 0 obj",
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatPdfNumber(scene.width)} ${formatPdfNumber(scene.height)}]`,
      "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
      "endobj\n",
    ].join("\n"),
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}endstream\nendobj\n`,
  ];
  const header = "%PDF-1.4\n";
  const offsets: number[] = [];
  let cursor = encoder.encode(header).length;

  for (const object of objects) {
    offsets.push(cursor);
    cursor += encoder.encode(object).length;
  }

  const xrefOffset = cursor;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.map((offset) => `${offset.toString().padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    `${xrefOffset}`,
    "%%EOF",
    "",
  ].join("\n");

  return encoder.encode(`${header}${objects.join("")}${xref}`);
}

export function annotatedSpectrumPdfBytes(
  peaks: SpectrumPeak[],
  settings: PlotSettings,
  theme: ThemeName,
  width = 1600,
  height = 900,
): Uint8Array {
  return buildPdfDocument(createSpectrumPlotScene({
    peaks,
    settings,
    width,
    height,
    theme,
    renderMode: "export",
    transparentBackground: true,
  }));
}

export async function downloadAnnotatedSpectrumPdf(
  peaks: SpectrumPeak[],
  settings: PlotSettings,
  theme: ThemeName,
  filename = "annotated_spectrum.pdf",
  width = 1600,
  height = 900,
): Promise<void> {
  const bytes = annotatedSpectrumPdfBytes(peaks, settings, theme, width, height);
  const buffer = new Uint8Array(bytes.byteLength);
  buffer.set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  downloadBlob(blob, filename);
}
