import {
  computeMajorTicks,
  computeMinorTicks,
  filterPeaksInRange,
  formatTickValue,
  resolveMajorTickSpacing,
  resolvePlotDomain,
  resolveThresholdPercent,
} from "./plotTicks";
import { tokenizeFormulaDisplay } from "../chemistry/formulaDisplay";
import type { PlotSettings, SpectrumPeak, ThemeName } from "../types";

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

export type PlotMargins = {
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

export type PlotTextRun = {
  text: string;
  script?: "normal" | "sub" | "sup";
  leadingGap?: number;
};

export type PlotRichText = {
  kind: "rich-text";
  x: number;
  y: number;
  lines: PlotTextRun[][];
  fill: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  align: CanvasTextAlign;
  baseline: CanvasTextBaseline;
  rotation?: number;
};

export type PlotShape = PlotRect | PlotLine | PlotCircle | PlotText | PlotRichText;

export type PlotScene = {
  width: number;
  height: number;
  pageBackground: string;
  shapes: PlotShape[];
};

const CANVAS_FONT_FAMILY = "Inter, system-ui, sans-serif";
export const PLOT_RICH_TEXT_SCRIPT_SCALE = 0.72;
export const PLOT_RICH_TEXT_SUPERSCRIPT_OFFSET_EM = -0.38;
export const PLOT_RICH_TEXT_SUBSCRIPT_OFFSET_EM = 0.16;
export const PLOT_RICH_TEXT_LINE_HEIGHT_EM = 1.28;
export const PLOT_RICH_TEXT_ISOTOPE_GAP_EM = 0.18;

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

export function plotTextRunFontSize(fontSize: number, script: PlotTextRun["script"]): number {
  return script === "sub" || script === "sup" ? fontSize * PLOT_RICH_TEXT_SCRIPT_SCALE : fontSize;
}

export function plotTextRunBaselineOffset(fontSize: number, script: PlotTextRun["script"]): number {
  if (script === "sup") return fontSize * PLOT_RICH_TEXT_SUPERSCRIPT_OFFSET_EM;
  if (script === "sub") return fontSize * PLOT_RICH_TEXT_SUBSCRIPT_OFFSET_EM;
  return 0;
}

export function plotRichTextLineHeight(fontSize: number): number {
  return fontSize * PLOT_RICH_TEXT_LINE_HEIGHT_EM;
}

export function plotRichTextLineOffset(lineIndex: number, lineCount: number, fontSize: number, baseline: CanvasTextBaseline): number {
  const lineHeight = plotRichTextLineHeight(fontSize);
  if (baseline === "top" || baseline === "hanging") return lineIndex * lineHeight;
  if (baseline === "middle") return (lineIndex - (lineCount - 1) / 2) * lineHeight;
  return -(lineCount - lineIndex - 1) * lineHeight;
}

export function formulaToPlotTextRuns(formula: string): PlotTextRun[] {
  const runs: PlotTextRun[] = [];

  for (const token of tokenizeFormulaDisplay(formula)) {
    if (token.kind === "isotope") {
      const previousRun = runs.at(-1);
      const massRun: PlotTextRun = { text: token.massNumber, script: "sup" };
      if (previousRun?.script !== "sub") massRun.leadingGap = PLOT_RICH_TEXT_ISOTOPE_GAP_EM;
      runs.push(massRun, { text: token.element, script: "normal" });
      continue;
    }

    runs.push({
      text: token.text,
      script: token.kind === "text" ? "normal" : token.kind,
    });
  }

  return runs;
}

function shouldShowPeakLabel(peak: SpectrumPeak, settings: PlotSettings): boolean {
  if (!settings.showLabels) return false;
  if (settings.labelFilter === "none") return false;

  const hasAssignment = Boolean(peak.assignments?.length);
  const isThresholdPeak = peak.relativeIntensity >= resolveThresholdPercent(settings);
  if (settings.labelFilter === "assigned-only" && !hasAssignment) return false;
  if (settings.labelFilter === "threshold" && !isThresholdPeak) return false;
  if (settings.labelFilter === "both" && !hasAssignment && !isThresholdPeak) return false;
  return true;
}

function assignmentLabelFormula(peak: SpectrumPeak): string | null {
  const assignment = peak.assignments?.[0];
  return assignment?.ionFormula ?? assignment?.formula ?? null;
}

function buildPeakLabelShapes(
  peak: SpectrumPeak,
  settings: PlotSettings,
  x: number,
  y: number,
  plotTop: number,
  fill: string,
): PlotShape[] {
  if (!shouldShowPeakLabel(peak, settings)) return [];

  const formula = assignmentLabelFormula(peak);
  const mzLabel = peak.mz.toFixed(4);
  const labelLines: Array<{ kind: "formula"; text: string } | { kind: "text"; text: string }> = [];

  if (settings.labelMode === "formula") {
    if (formula) labelLines.push({ kind: "formula", text: formula });
  } else if (settings.labelMode === "mz") {
    labelLines.push({ kind: "text", text: mzLabel });
  } else if (formula) {
    labelLines.push({ kind: "formula", text: formula }, { kind: "text", text: mzLabel });
  } else {
    labelLines.push({ kind: "text", text: mzLabel });
  }

  return labelLines.map((line, lineIndex) => {
    const lineY = Math.max(plotTop + 10, y - 8 - (labelLines.length - lineIndex - 1) * 14);
    if (line.kind === "formula") {
      return {
        kind: "rich-text",
        x,
        y: lineY,
        lines: [formulaToPlotTextRuns(line.text)],
        fill,
        fontSize: 11,
        fontWeight: "normal",
        align: "center",
        baseline: "bottom",
      };
    }

    return {
      kind: "text",
      x,
      y: lineY,
      text: line.text,
      fill,
      fontSize: 11,
      fontWeight: "normal",
      align: "center",
      baseline: "bottom",
    };
  });
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
    const { x, y } = resolveCoordinates(peak.mz, peak.relativeIntensity, domain, width, height, margins);
    shapes.push(...buildPeakLabelShapes(peak, settings, x, y, plotTop, palette.text));
  }

  return {
    width,
    height,
    pageBackground: palette.background,
    shapes,
  };
}

function canvasFont(fontSize: number, fontWeight: PlotText["fontWeight"]): string {
  return `${fontWeight === "bold" ? 600 : 400} ${fontSize}px ${CANVAS_FONT_FAMILY}`;
}

function measureRichTextLine(context: CanvasRenderingContext2D, line: PlotTextRun[], fontSize: number, fontWeight: PlotText["fontWeight"]): number {
  return line.reduce((width, run) => {
    const runFontSize = plotTextRunFontSize(fontSize, run.script);
    context.font = canvasFont(runFontSize, fontWeight);
    return width + fontSize * (run.leadingGap ?? 0) + context.measureText(run.text).width;
  }, 0);
}

function textAlignOffset(width: number, align: CanvasTextAlign): number {
  if (align === "center") return -width / 2;
  if (align === "right" || align === "end") return -width;
  return 0;
}

function drawRichTextLine(
  context: CanvasRenderingContext2D,
  line: PlotTextRun[],
  x: number,
  y: number,
  fill: string,
  fontSize: number,
  fontWeight: PlotText["fontWeight"],
  align: CanvasTextAlign,
  baseline: CanvasTextBaseline,
): void {
  const lineWidth = measureRichTextLine(context, line, fontSize, fontWeight);
  let cursor = x + textAlignOffset(lineWidth, align);

  context.fillStyle = fill;
  context.textAlign = "left";
  context.textBaseline = baseline;

  for (const run of line) {
    cursor += fontSize * (run.leadingGap ?? 0);
    const runFontSize = plotTextRunFontSize(fontSize, run.script);
    const runYOffset = plotTextRunBaselineOffset(fontSize, run.script);
    context.font = canvasFont(runFontSize, fontWeight);
    context.fillText(run.text, cursor, y + runYOffset);
    cursor += context.measureText(run.text).width;
  }
}

function drawRichText(context: CanvasRenderingContext2D, shape: PlotRichText): void {
  context.save();

  if (shape.rotation) {
    context.translate(shape.x, shape.y);
    context.rotate((shape.rotation * Math.PI) / 180);
  }

  shape.lines.forEach((line, lineIndex) => {
    const x = shape.rotation ? 0 : shape.x;
    const y = (shape.rotation ? 0 : shape.y) + plotRichTextLineOffset(lineIndex, shape.lines.length, shape.fontSize, shape.baseline);
    drawRichTextLine(context, line, x, y, shape.fill, shape.fontSize, shape.fontWeight, shape.align, shape.baseline);
  });

  context.restore();
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

    if (shape.kind === "rich-text") {
      drawRichText(context, shape);
      continue;
    }

    context.save();
    context.fillStyle = shape.fill;
    context.font = canvasFont(shape.fontSize, shape.fontWeight);
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
