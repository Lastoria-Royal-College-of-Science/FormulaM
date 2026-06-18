import { renderSpectrumPlot } from "../plot/plotScene";
import { downloadBlob } from "./download";
import type { PlotSettings, SpectrumPeak, ThemeName } from "../types";

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
    renderMode: "export",
    transparentBackground: true,
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("PNG export failed: browser did not return a PNG blob."));
    }, "image/png");
  });

  downloadBlob(blob, filename);
}
