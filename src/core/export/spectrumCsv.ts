import type { SpectrumPeak } from "../types";
import { csvEscape } from "./csv";
import { downloadBlob } from "./download";

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

export function downloadAssignmentsCsv(
  peaks: SpectrumPeak[],
  includeUnassigned = false,
  filename = "spectrum_assignments.csv",
): void {
  const blob = new Blob([assignmentsToCsv(peaks, includeUnassigned)], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, filename);
}
