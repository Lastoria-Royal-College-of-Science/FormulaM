import { defaultIsotopeLabel, elementCapacity } from "../chemistry/massData";
import type { FormulaSpaceRow, MassIndex, SearchElements } from "../types";

export const DEFAULT_ROWS = [
  { element: "C", lower: 0, upper: 20 },
  { element: "H", lower: 0, upper: 60 },
  { element: "N", lower: 0, upper: 10 },
  { element: "O", lower: 0, upper: 20 },
] as const;

export function createInitialRows(massIndex: MassIndex): { rows: FormulaSpaceRow[]; nextRowId: number } {
  const rows: FormulaSpaceRow[] = [];
  let nextRowId = 0;
  for (const row of DEFAULT_ROWS) {
    if (massIndex.defaultIsotopeBySymbol[row.element]) {
      rows.push(makeRow(nextRowId, massIndex, rows, row.element, row.lower, row.upper));
      nextRowId += 1;
    }
  }
  if (!rows.length) {
    rows.push(makeRow(nextRowId, massIndex, rows, firstAvailableElement(rows, massIndex), 0, 10));
    nextRowId += 1;
  }
  return { rows, nextRowId };
}

export function makeRow(
  id: number,
  massIndex: MassIndex,
  rows: FormulaSpaceRow[],
  element: string | null = null,
  lower: number | "" = 0,
  upper: number | "" = 10,
  isotope: string | null = null,
): FormulaSpaceRow {
  const chosenElement = element || firstAvailableElement(rows, massIndex);
  return {
    id,
    element: chosenElement,
    isotope: isotope || chooseUnusedIsotope(rows, massIndex, chosenElement, id),
    lower,
    upper,
  };
}

function countRowsByElement(rows: FormulaSpaceRow[], exceptRowId: number | null = null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.id === exceptRowId) continue;
    counts.set(row.element, (counts.get(row.element) || 0) + 1);
  }
  return counts;
}

export function elementOptionsForRow(rows: FormulaSpaceRow[], massIndex: MassIndex, rowId: number | null = null): string[] {
  const counts = countRowsByElement(rows, rowId);
  const options: string[] = [];
  for (const symbol of massIndex.elementSymbols) {
    if ((counts.get(symbol) || 0) < elementCapacity(massIndex, symbol)) options.push(symbol);
  }
  const row = rows.find((candidate) => candidate.id === rowId);
  if (row && !options.includes(row.element)) options.unshift(row.element);
  return options;
}

export function firstAvailableElement(rows: FormulaSpaceRow[], massIndex: MassIndex): string {
  const options = elementOptionsForRow(rows, massIndex, null);
  if (!options.length) throw new Error("No additional element rows are available.");
  return options[0] ?? "H";
}

function usedIsotopesForElement(rows: FormulaSpaceRow[], element: string, exceptRowId: number | null = null): Set<string> {
  const used = new Set<string>();
  for (const row of rows) {
    if (row.id !== exceptRowId && row.element === element) used.add(row.isotope);
  }
  return used;
}

export function chooseUnusedIsotope(rows: FormulaSpaceRow[], massIndex: MassIndex, element: string, exceptRowId: number | null = null): string {
  const options = massIndex.isotopeOptions[element] || [];
  if (!options.length) throw new Error(`No isotopes are available for ${element}.`);
  const used = usedIsotopesForElement(rows, element, exceptRowId);
  const defaultLabel = defaultIsotopeLabel(massIndex, element);
  if (!used.has(defaultLabel) && options.includes(defaultLabel)) return defaultLabel;
  return options.find((label) => !used.has(label)) || options[0] || defaultLabel;
}

export function enforceUniqueIsotopes(rows: FormulaSpaceRow[], massIndex: MassIndex, changedRowId: number, previousIsotope: string | null = null): FormulaSpaceRow[] {
  const next = rows.map((row) => ({ ...row }));
  const changedRow = next.find((row) => row.id === changedRowId);
  if (!changedRow) return next;

  const options = massIndex.isotopeOptions[changedRow.element] || [];
  if (!options.includes(changedRow.isotope)) {
    changedRow.isotope = chooseUnusedIsotope(next, massIndex, changedRow.element, changedRow.id);
  }

  const duplicate = next.find((row) => row.id !== changedRow.id && row.element === changedRow.element && row.isotope === changedRow.isotope);
  if (duplicate) {
    if (previousIsotope && options.includes(previousIsotope) && previousIsotope !== changedRow.isotope) {
      duplicate.isotope = previousIsotope;
    } else {
      duplicate.isotope = chooseUnusedIsotope(next, massIndex, duplicate.element, duplicate.id);
    }
  }

  const seen = new Set<string>();
  for (const row of next.filter((candidate) => candidate.element === changedRow.element)) {
    if (!seen.has(row.isotope)) {
      seen.add(row.isotope);
      continue;
    }
    const replacement = options.find((label) => !seen.has(label));
    if (replacement) {
      row.isotope = replacement;
      seen.add(replacement);
    }
  }
  return next;
}

export function searchKeyForRow(row: FormulaSpaceRow, massIndex: MassIndex): string {
  return row.isotope === defaultIsotopeLabel(massIndex, row.element) ? row.element : row.isotope;
}

function parseNonNegativeInteger(value: unknown, label: string, rowNumber: number): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new Error(`Row ${rowNumber}: ${label} must be a non-negative integer.`);
  return number;
}

export function validateAndBuildElements(rows: FormulaSpaceRow[], massIndex: MassIndex): SearchElements {
  if (!rows.length) throw new Error("Enter at least one element bound.");

  const rowsByElement = new Map<string, number>();
  const usedIsotopes = new Map<string, Set<string>>();
  const elements: SearchElements = {};

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row) continue;
    const rowNumber = index + 1;
    if (!massIndex.defaultIsotopeBySymbol[row.element]) throw new Error(`Row ${rowNumber}: unknown element ${row.element}.`);
    const isotopeOptions = massIndex.isotopeOptions[row.element] || [];
    if (!isotopeOptions.includes(row.isotope)) throw new Error(`Row ${rowNumber}: isotope ${row.isotope} is not available for element ${row.element}.`);

    rowsByElement.set(row.element, (rowsByElement.get(row.element) || 0) + 1);
    if ((rowsByElement.get(row.element) || 0) > isotopeOptions.length) throw new Error(`Row ${rowNumber}: element ${row.element} cannot appear more than ${isotopeOptions.length} time(s).`);

    const elementIsotopes = usedIsotopes.get(row.element) || new Set<string>();
    if (elementIsotopes.has(row.isotope)) throw new Error(`Row ${rowNumber}: isotope ${row.isotope} is already selected for element ${row.element}.`);
    elementIsotopes.add(row.isotope);
    usedIsotopes.set(row.element, elementIsotopes);

    const lower = parseNonNegativeInteger(row.lower, "lower limit", rowNumber);
    const upper = parseNonNegativeInteger(row.upper, "upper limit", rowNumber);
    if (lower > upper) throw new Error(`Row ${rowNumber}: lower limit must be less than or equal to upper limit.`);

    const key = searchKeyForRow(row, massIndex);
    if (key in elements) throw new Error(`Row ${rowNumber}: duplicate search key ${key}.`);
    elements[key] = [lower, upper];
  }
  return elements;
}
