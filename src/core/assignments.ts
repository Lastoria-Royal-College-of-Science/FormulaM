import type { FormulaHit, PeakAssignment, SpectrumPeak } from "./types";

function parseOptionalNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildPeakAssignment(peak: SpectrumPeak, hit: FormulaHit): PeakAssignment {
  return {
    peakId: peak.id,
    mz: peak.mz,
    intensity: peak.intensity,
    relativeIntensity: peak.relativeIntensity,
    formula: hit.formula,
    ionFormula: hit.ion_formula || undefined,
    predictedMz: parseOptionalNumber(hit.mz),
    errorDa: parseOptionalNumber(hit.error_da),
    errorPpm: parseOptionalNumber(hit.error_ppm),
    source: "formula-search",
  };
}

export function matchesAssignmentHit(assignment: PeakAssignment | null | undefined, hit: FormulaHit): boolean {
  if (!assignment) return false;
  if (assignment.ionFormula) return assignment.ionFormula === hit.ion_formula;
  return assignment.formula === hit.formula;
}

export function upsertAssignment(assignments: PeakAssignment[], assignment: PeakAssignment): PeakAssignment[] {
  return [...assignments.filter((item) => item.peakId !== assignment.peakId), assignment].sort((left, right) => left.mz - right.mz);
}

export function removeAssignment(assignments: PeakAssignment[], peakId: string): PeakAssignment[] {
  return assignments.filter((assignment) => assignment.peakId !== peakId);
}

export function getAssignment(assignments: PeakAssignment[], peakId: string | null | undefined): PeakAssignment | null {
  if (!peakId) return null;
  return assignments.find((assignment) => assignment.peakId === peakId) ?? null;
}

export function attachAssignmentsToPeaks(peaks: SpectrumPeak[], assignments: PeakAssignment[], selectedPeakId: string | null): SpectrumPeak[] {
  const assignmentMap = new Map(assignments.map((assignment) => [assignment.peakId, assignment]));
  return peaks.map((peak) => {
    const assignment = assignmentMap.get(peak.id);
    return {
      ...peak,
      selected: peak.id === selectedPeakId,
      assignments: assignment ? [assignment] : [],
    };
  });
}
