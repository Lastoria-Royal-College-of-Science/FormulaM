import { downloadBlob } from "./download";
import type { FormulaHit } from "../types";

export function csvEscape(value: unknown): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function hitsToCsv(hits: FormulaHit[]): string {
  const headers = ["formula", "ion_formula", "charge", "neutral_mass", "predicted_mz", "error_da", "error_ppm"];
  const rows = hits.map((hit) => [
    hit.formula,
    hit.ion_formula,
    hit.charge_state,
    hit.mass,
    hit.mz,
    hit.error_da,
    hit.error_ppm,
  ]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function downloadHitsCsv(hits: FormulaHit[], filename = "formula_hits.csv"): void {
  const blob = new Blob([hitsToCsv(hits)], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}
