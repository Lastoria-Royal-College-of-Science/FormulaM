import {
  createSpectrumPlotScene,
  plotRichTextLineOffset,
  plotTextRunBaselineOffset,
  plotTextRunFontSize,
} from "../plot/plotScene";
import { downloadBlob } from "./download";
import type { PlotCircle, PlotRichText, PlotScene, PlotShape, PlotText, PlotTextRun } from "../plot/plotScene";
import type { PlotSettings, SpectrumPeak, ThemeName } from "../types";

type PdfTextMetrics = {
  width: number;
  ascent: number;
  descent: number;
};

const PDF_FONT_FAMILY = "Helvetica, Arial, sans-serif";

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

function measurePdfRichTextLine(line: PlotTextRun[], fontSize: number, fontWeight: PlotText["fontWeight"]): PdfTextMetrics {
  return line.reduce<PdfTextMetrics>((combined, run) => {
    const runFontSize = plotTextRunFontSize(fontSize, run.script);
    const runOffset = plotTextRunBaselineOffset(fontSize, run.script);
    const metrics = measurePdfText(run.text, runFontSize, fontWeight);
    return {
      width: combined.width + fontSize * (run.leadingGap ?? 0) + metrics.width,
      ascent: Math.max(combined.ascent, metrics.ascent - runOffset),
      descent: Math.max(combined.descent, metrics.descent + runOffset),
    };
  }, { width: 0, ascent: fontSize * 0.8, descent: fontSize * 0.2 });
}

function buildPdfRichText(shape: PlotRichText, scene: PlotScene): string {
  const canvasRotation = ((shape.rotation ?? 0) * Math.PI) / 180;
  const pdfRotation = -canvasRotation;
  const canvasCosine = Math.cos(canvasRotation);
  const canvasSine = Math.sin(canvasRotation);
  const pdfCosine = Math.cos(pdfRotation);
  const pdfSine = Math.sin(pdfRotation);
  const fontName = shape.fontWeight === "bold" ? "/F2" : "/F1";
  const commands = ["q"];

  shape.lines.forEach((line, lineIndex) => {
    const lineMetrics = measurePdfRichTextLine(line, shape.fontSize, shape.fontWeight);
    const lineYOffset = plotRichTextLineOffset(lineIndex, shape.lines.length, shape.fontSize, shape.baseline)
      + textBaselineOffset(lineMetrics, shape.baseline);
    let cursor = textAlignOffset(lineMetrics.width, shape.align);

    for (const run of line) {
      cursor += shape.fontSize * (run.leadingGap ?? 0);
      const runFontSize = plotTextRunFontSize(shape.fontSize, run.script);
      const runMetrics = measurePdfText(run.text, runFontSize, shape.fontWeight);
      const runYOffset = lineYOffset + plotTextRunBaselineOffset(shape.fontSize, run.script);
      const baselineX = shape.x + cursor * canvasCosine - runYOffset * canvasSine;
      const baselineY = shape.y + cursor * canvasSine + runYOffset * canvasCosine;

      commands.push(
        "BT",
        `${fontName} ${formatPdfNumber(runFontSize)} Tf`,
        `${pdfColorCommand(shape.fill, scene.pageBackground)} rg`,
        [
          formatPdfNumber(pdfCosine),
          formatPdfNumber(pdfSine),
          formatPdfNumber(-pdfSine),
          formatPdfNumber(pdfCosine),
          formatPdfNumber(baselineX),
          formatPdfNumber(scene.height - baselineY),
          "Tm",
        ].join(" "),
        `(${escapePdfText(run.text)}) Tj`,
        "ET",
      );

      cursor += runMetrics.width;
    }
  });

  commands.push("Q");
  return commands.join("\n");
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

  if (shape.kind === "rich-text") {
    return buildPdfRichText(shape, scene);
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
