import katex from "katex";
import "katex/contrib/mhchem";

export const MZ_TEX = "m/z";
export const X_MIN_TEX = "x_{\\min}";
export const X_MAX_TEX = "x_{\\max}";
export const Y_MAX_TEX = "y_{\\max}";
export const PPM_ERROR_TEX =
  "\\mathrm{ppm\\ error} = \\frac{\\mathrm{predicted}\\ m/z - \\mathrm{observed}\\ m/z}{\\mathrm{observed}\\ m/z} \\times 1{,}000{,}000";

export function renderTexToHtml(tex: string, displayMode = false): string {
  return katex.renderToString(tex, {
    displayMode,
    output: "htmlAndMathml",
    throwOnError: true,
    trust: false,
  });
}
