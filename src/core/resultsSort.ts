import type { FormulaHit } from "./types";

export type ResultSortColumn = "mass" | "mz" | "error_da" | "error_ppm";
export type ResultSortDirection = "asc" | "desc";
export type ResultSortIndicator = "sort" | ResultSortDirection;

export interface ResultSortState {
  column: ResultSortColumn;
  direction: ResultSortDirection;
}

const numericValueByColumn: Record<ResultSortColumn, (hit: FormulaHit) => number> = {
  mass: (hit) => Number(hit.mass),
  mz: (hit) => Number(hit.mz),
  error_da: (hit) => Math.abs(Number(hit.error_da)),
  error_ppm: (hit) => Math.abs(Number(hit.error_ppm)),
};

export function cycleResultSortState(sortState: ResultSortState | null, column: ResultSortColumn): ResultSortState | null {
  if (!sortState || sortState.column !== column) {
    return { column, direction: "asc" };
  }

  if (sortState.direction === "asc") {
    return { column, direction: "desc" };
  }

  return null;
}

export function getResultSortAria(sortState: ResultSortState | null, column: ResultSortColumn): "ascending" | "descending" | "none" {
  if (!sortState || sortState.column !== column) return "none";
  return sortState.direction === "asc" ? "ascending" : "descending";
}

export function getResultSortIndicator(sortState: ResultSortState | null, column: ResultSortColumn): ResultSortIndicator {
  if (!sortState || sortState.column !== column) return "sort";
  return sortState.direction;
}

export function getResultSortIconClass(sortState: ResultSortState | null, column: ResultSortColumn): string {
  const indicator = getResultSortIndicator(sortState, column);

  if (indicator === "asc") return "i-typcn-arrow-sorted-up";
  if (indicator === "desc") return "i-typcn-arrow-sorted-down";
  return "i-typcn-arrow-unsorted";
}

export function sortFormulaHits(hits: FormulaHit[], sortState: ResultSortState | null): FormulaHit[] {
  if (!sortState || hits.length < 2) return hits;

  const directionFactor = sortState.direction === "asc" ? 1 : -1;
  const readValue = numericValueByColumn[sortState.column];

  return [...hits].sort((left, right) => {
    const leftValue = readValue(left);
    const rightValue = readValue(right);

    if (leftValue === rightValue) return 0;
    if (!Number.isFinite(leftValue)) return 1;
    if (!Number.isFinite(rightValue)) return -1;

    return (leftValue - rightValue) * directionFactor;
  });
}
