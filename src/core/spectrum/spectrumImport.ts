import { columnCountForTable, normalizeSpectrumTable, suggestSpectrumSelection } from "./spectrumNormalize";
import type { SpectrumImportResult, SpectrumImportSheet, SpectrumImportSource } from "../types";

function fileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : "";
}

function buildImportSheet(name: string, table: unknown[][]): SpectrumImportSheet {
  const suggestion = suggestSpectrumSelection(table);
  return {
    name,
    table,
    columnCount: columnCountForTable(table),
    rowCount: table.length,
    suggestedHasHeaderRow: suggestion.hasHeaderRow,
    suggestedMzColumnIndex: suggestion.mzColumnIndex,
    suggestedIntensityColumnIndex: suggestion.intensityColumnIndex,
  };
}

export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let index = 0;
  let inQuotes = false;

  while (index < text.length) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      cell += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      index += 1;
      continue;
    }

    if (char === "\n" || char === "\r") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (char === "\r" && text[index + 1] === "\n") index += 2;
      else index += 1;
      continue;
    }

    cell += char;
    index += 1;
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

async function loadCsvImportSource(file: File): Promise<SpectrumImportSource> {
  const text = await file.text();
  return {
    sourceName: file.name,
    sheets: [buildImportSheet("CSV", parseCsvText(text))],
  };
}

async function loadExcelImportSource(file: File): Promise<SpectrumImportSource> {
  const [{ read, utils }, buffer] = await Promise.all([import("xlsx"), file.arrayBuffer()]);
  const workbook = read(buffer, { type: "array", dense: true });
  const sheetNames = workbook.SheetNames;
  if (!sheetNames.length) throw new Error(`Spectrum import failed: ${file.name} does not contain any worksheets.`);

  const sheets = sheetNames.map((sheetName) => {
    const table = utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      raw: false,
      blankrows: false,
    }) as unknown[][];
    return buildImportSheet(sheetName, table);
  });

  return {
    sourceName: file.name,
    sheets,
  };
}

export async function loadSpectrumImportSource(file: File): Promise<SpectrumImportSource> {
  const extension = fileExtension(file.name);
  if (extension === ".csv") return loadCsvImportSource(file);
  if (extension === ".xlsx" || extension === ".xls") return loadExcelImportSource(file);
  throw new Error(`Spectrum import failed: unsupported file type ${extension || "(no extension)"}.`);
}

export async function importSpectrumFile(file: File): Promise<SpectrumImportResult> {
  const source = await loadSpectrumImportSource(file);
  const firstSheet = source.sheets[0];
  if (!firstSheet) throw new Error(`Spectrum import failed: ${file.name} does not contain any readable tables.`);

  return normalizeSpectrumTable(firstSheet.table, {
    sourceName: source.sheets.length > 1 ? `${source.sourceName} / ${firstSheet.name}` : source.sourceName,
    hasHeaderRow: firstSheet.suggestedHasHeaderRow,
    mzColumnIndex: firstSheet.suggestedMzColumnIndex,
    intensityColumnIndex: firstSheet.suggestedIntensityColumnIndex,
  });
}
