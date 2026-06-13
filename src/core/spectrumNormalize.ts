import type { SpectrumImportResult, SpectrumPreviewTable, SpectrumPeak } from "./types";

const MZ_HEADER_TOKENS = ["mz", "moverz", "masstocharge", "mtoz", "mass"];
const INTENSITY_HEADER_TOKENS = ["abund", "abundance", "intensity", "signal", "area", "height"];

type NormalizeSpectrumTableOptions = {
  hasHeaderRow?: boolean;
  intensityColumnIndex?: number | null;
  mzColumnIndex?: number | null;
  sourceName?: string;
};

function isMzHeaderToken(token: string): boolean {
  return MZ_HEADER_TOKENS.some((candidate) => token === candidate || token.includes(candidate));
}

function isIntensityHeaderToken(token: string): boolean {
  return INTENSITY_HEADER_TOKENS.some((candidate) => token === candidate || token.includes(candidate));
}

export function normalizeHeaderToken(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function isBlankRow(row: readonly unknown[]): boolean {
  return row.every((cell) => String(cell ?? "").trim() === "");
}

export function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function firstNonBlankRowIndex(table: readonly (readonly unknown[])[]): number {
  return table.findIndex((row) => !isBlankRow(row));
}

export function columnCountForTable(table: readonly (readonly unknown[])[]): number {
  return table.reduce((max, row) => Math.max(max, row.length), 0);
}

function normalizeRowLength(row: readonly unknown[], columnCount: number): unknown[] {
  return Array.from({ length: columnCount }, (_unused, index) => row[index] ?? "");
}

function stringifyCell(value: unknown): string {
  return String(value ?? "").trim();
}

function buildNumericColumnLabels(columnCount: number): string[] {
  return Array.from({ length: columnCount }, (_unused, index) => String(index + 1));
}

function buildHeaderLabels(headerRow: readonly unknown[], columnCount: number): string[] {
  return Array.from({ length: columnCount }, (_unused, index) => {
    const label = stringifyCell(headerRow[index]);
    return label || String(index + 1);
  });
}

function detectColumnIndexes(labels: readonly string[]): { mzColumnIndex: number | null; intensityColumnIndex: number | null } {
  let mzColumnIndex: number | null = null;
  let intensityColumnIndex: number | null = null;

  labels.forEach((label, index) => {
    const token = normalizeHeaderToken(label);
    if (mzColumnIndex === null && isMzHeaderToken(token)) mzColumnIndex = index;
    if (intensityColumnIndex === null && isIntensityHeaderToken(token)) intensityColumnIndex = index;
  });

  return { mzColumnIndex, intensityColumnIndex };
}

export function suggestHeaderRow(table: readonly (readonly unknown[])[]): boolean {
  const rowIndex = firstNonBlankRowIndex(table);
  if (rowIndex < 0) return false;

  const firstRow = table[rowIndex];
  const nonBlankCells = firstRow.filter((cell) => String(cell ?? "").trim() !== "");
  if (!nonBlankCells.length) return false;

  const labels = buildHeaderLabels(firstRow, firstRow.length);
  const detected = detectColumnIndexes(labels);
  if (detected.mzColumnIndex !== null || detected.intensityColumnIndex !== null) return true;

  const numericCount = nonBlankCells.filter((cell) => parseFiniteNumber(cell) !== null).length;
  return numericCount < nonBlankCells.length / 2;
}

export function columnLabelsForTable(table: readonly (readonly unknown[])[], hasHeaderRow: boolean): string[] {
  const columnCount = columnCountForTable(table);
  if (columnCount === 0) return [];

  const headerIndex = firstNonBlankRowIndex(table);
  if (!hasHeaderRow || headerIndex < 0) return buildNumericColumnLabels(columnCount);
  return buildHeaderLabels(normalizeRowLength(table[headerIndex], columnCount), columnCount);
}

export function suggestSpectrumSelection(
  table: readonly (readonly unknown[])[],
  hasHeaderRow = suggestHeaderRow(table),
): { hasHeaderRow: boolean; mzColumnIndex: number | null; intensityColumnIndex: number | null } {
  const columnCount = columnCountForTable(table);
  if (columnCount === 0) {
    return {
      hasHeaderRow,
      mzColumnIndex: null,
      intensityColumnIndex: null,
    };
  }

  const labels = columnLabelsForTable(table, hasHeaderRow);
  const detected = hasHeaderRow ? detectColumnIndexes(labels) : { mzColumnIndex: null, intensityColumnIndex: null };

  if (detected.mzColumnIndex !== null && detected.intensityColumnIndex !== null) {
    return {
      hasHeaderRow,
      mzColumnIndex: detected.mzColumnIndex,
      intensityColumnIndex: detected.intensityColumnIndex,
    };
  }

  if (columnCount >= 2 && !hasHeaderRow) {
    return {
      hasHeaderRow,
      mzColumnIndex: 0,
      intensityColumnIndex: 1,
    };
  }

  return {
    hasHeaderRow,
    mzColumnIndex: detected.mzColumnIndex,
    intensityColumnIndex: detected.intensityColumnIndex,
  };
}

export function buildSpectrumPreview(
  table: readonly (readonly unknown[])[],
  hasHeaderRow = suggestHeaderRow(table),
  maxRows = 6,
): SpectrumPreviewTable {
  const rowIndex = firstNonBlankRowIndex(table);
  const columnLabels = columnLabelsForTable(table, hasHeaderRow);
  const columnCount = columnLabels.length;
  const dataStartIndex = rowIndex < 0 ? 0 : rowIndex + (hasHeaderRow ? 1 : 0);
  const previewRows = table
    .slice(dataStartIndex)
    .filter((row) => !isBlankRow(row))
    .slice(0, maxRows)
    .map((row) => normalizeRowLength(row, columnCount).map((cell) => String(cell ?? "")));

  return {
    columnLabels,
    rows: previewRows,
    totalRows: Math.max(0, table.slice(dataStartIndex).filter((row) => !isBlankRow(row)).length),
  };
}

function validateColumnIndex(columnIndex: number | null | undefined, columnCount: number, label: string): number | null {
  if (columnIndex === null || columnIndex === undefined) return null;
  if (!Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex >= columnCount) {
    throw new Error(`Spectrum import failed: ${label} selection is outside the table range.`);
  }
  return columnIndex;
}

function resolveColumns(
  labels: readonly string[],
  hasHeaderRow: boolean,
  mzColumnIndex?: number | null,
  intensityColumnIndex?: number | null,
): { mzColumnIndex: number; intensityColumnIndex: number; mzColumn: string; intensityColumn: string } {
  const columnCount = labels.length;
  const validatedMzColumnIndex = validateColumnIndex(mzColumnIndex, columnCount, "m/z column");
  const validatedIntensityColumnIndex = validateColumnIndex(intensityColumnIndex, columnCount, "intensity column");
  const detected = hasHeaderRow ? detectColumnIndexes(labels) : { mzColumnIndex: null, intensityColumnIndex: null };

  if (!hasHeaderRow && validatedMzColumnIndex === null && validatedIntensityColumnIndex === null && columnCount >= 2) {
    return {
      mzColumnIndex: 0,
      intensityColumnIndex: 1,
      mzColumn: labels[0],
      intensityColumn: labels[1],
    };
  }

  const resolvedMzColumnIndex = validatedMzColumnIndex ?? detected.mzColumnIndex;
  const resolvedIntensityColumnIndex = validatedIntensityColumnIndex ?? detected.intensityColumnIndex;
  if (resolvedMzColumnIndex === null) {
    throw new Error("Spectrum import failed: select the m/z column before importing.");
  }
  if (resolvedIntensityColumnIndex === null) {
    throw new Error("Spectrum import failed: select the intensity/Abund column before importing.");
  }
  if (resolvedMzColumnIndex === resolvedIntensityColumnIndex) {
    throw new Error("Spectrum import failed: m/z and intensity must use different columns.");
  }

  return {
    mzColumnIndex: resolvedMzColumnIndex,
    intensityColumnIndex: resolvedIntensityColumnIndex,
    mzColumn: labels[resolvedMzColumnIndex],
    intensityColumn: labels[resolvedIntensityColumnIndex],
  };
}

export function normalizeSpectrumTable(
  table: readonly (readonly unknown[])[],
  options: NormalizeSpectrumTableOptions | string = {},
): SpectrumImportResult {
  const resolvedOptions = typeof options === "string" ? { sourceName: options } : options;
  const sourceName = resolvedOptions.sourceName ?? "spectrum data";
  const firstRowIndex = firstNonBlankRowIndex(table);
  if (firstRowIndex < 0) throw new Error(`Spectrum import failed: ${sourceName} is empty.`);

  const hasHeaderRow = resolvedOptions.hasHeaderRow ?? suggestHeaderRow(table);
  const columnLabels = columnLabelsForTable(table, hasHeaderRow);
  if (!columnLabels.length) throw new Error(`Spectrum import failed: ${sourceName} does not contain any columns.`);

  const { mzColumnIndex, intensityColumnIndex, mzColumn, intensityColumn } = resolveColumns(
    columnLabels,
    hasHeaderRow,
    resolvedOptions.mzColumnIndex,
    resolvedOptions.intensityColumnIndex,
  );

  const dataStartIndex = firstRowIndex + (hasHeaderRow ? 1 : 0);
  const parsedPeaks: Omit<SpectrumPeak, "id" | "relativeIntensity">[] = [];

  for (let rowIndex = dataStartIndex; rowIndex < table.length; rowIndex += 1) {
    const row = table[rowIndex];
    if (!row || isBlankRow(row)) continue;

    const normalizedRow = normalizeRowLength(row, columnLabels.length);
    const mz = parseFiniteNumber(normalizedRow[mzColumnIndex]);
    const intensity = parseFiniteNumber(normalizedRow[intensityColumnIndex]);
    if (mz === null || intensity === null) continue;
    if (mz <= 0 || intensity < 0) continue;

    parsedPeaks.push({ mz, intensity });
  }

  if (!parsedPeaks.length) {
    throw new Error(`Spectrum import failed: ${sourceName} does not contain any numeric peak rows.`);
  }

  parsedPeaks.sort((left, right) => left.mz - right.mz);
  const maxIntensity = parsedPeaks.reduce((max, peak) => Math.max(max, peak.intensity), 0);

  const peaks = parsedPeaks.map((peak, index) => ({
    id: `peak-${index + 1}`,
    mz: peak.mz,
    intensity: peak.intensity,
    relativeIntensity: maxIntensity > 0 ? (peak.intensity / maxIntensity) * 100 : 0,
    assignments: [],
  }));

  return {
    peaks,
    mzColumn,
    intensityColumn,
    sourceName,
  };
}
