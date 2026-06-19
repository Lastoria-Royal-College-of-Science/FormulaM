import type { ChargeSpec } from "../types";

const ISOTOPE_LABEL_RE = /^(\d+)([A-Z][a-z]?)$/;
const BRACKETED_ISOTOPE_LABEL_RE = /^\[(\d+)([A-Z][a-z]?)\]$/;
const ALIAS_TO_ISOTOPE: Record<string, string> = { D: "2H", T: "3H" };

export function isotopeLabel(symbol: string, massNumber: number | string): string {
  const number = Number.parseInt(String(massNumber), 10);
  if (!Number.isFinite(number) || number <= 0) throw new Error("isotope mass number must be positive");
  if (!/^[A-Z][a-z]?$/.test(symbol)) throw new Error(`invalid element symbol ${symbol}`);
  return `${number}${symbol}`;
}

export function normalizeSpeciesLabel(label: string): string {
  const text = String(label).trim();
  const bracketed = text.match(BRACKETED_ISOTOPE_LABEL_RE);
  if (bracketed) return isotopeLabel(bracketed[2], bracketed[1]);
  const plain = text.match(ISOTOPE_LABEL_RE);
  if (plain) return isotopeLabel(plain[2], plain[1]);
  return text;
}

export function isotopeBaseSymbol(label: string): string {
  const normalized = normalizeSpeciesLabel(label);
  if (normalized in ALIAS_TO_ISOTOPE) return "H";
  const match = normalized.match(ISOTOPE_LABEL_RE);
  return match ? match[2] : normalized;
}

export function isotopeMassNumber(label: string): number | null {
  let normalized = normalizeSpeciesLabel(label);
  if (normalized in ALIAS_TO_ISOTOPE) normalized = ALIAS_TO_ISOTOPE[normalized];
  const match = normalized.match(ISOTOPE_LABEL_RE);
  return match ? Number.parseInt(match[1], 10) : null;
}

export function displaySpeciesLabel(label: string): string {
  const normalized = normalizeSpeciesLabel(label);
  if (normalized === "D" || normalized === "T") return normalized;
  const match = normalized.match(ISOTOPE_LABEL_RE);
  return match ? `[${match[1]}${match[2]}]` : normalized;
}

function speciesSortKey(symbol: string, hasCarbon: boolean): { group: number; base: string; massNumber: number; symbol: string } {
  const base = isotopeBaseSymbol(symbol);
  const massNumber = isotopeMassNumber(symbol) || 0;
  let group: number;
  if (hasCarbon) {
    if (base === "C") group = 0;
    else if (base === "H") group = 1;
    else group = 2;
  } else {
    group = 0;
  }
  return { group, base, massNumber, symbol };
}

export function hillSortSymbols(symbols: Iterable<string>): string[] {
  const normalized = [...symbols].map(normalizeSpeciesLabel);
  const hasCarbon = normalized.some((symbol) => isotopeBaseSymbol(symbol) === "C");
  return normalized.sort((a, b) => {
    const ka = speciesSortKey(a, hasCarbon);
    const kb = speciesSortKey(b, hasCarbon);
    return ka.group - kb.group
      || ka.base.localeCompare(kb.base)
      || ka.massNumber - kb.massNumber
      || ka.symbol.localeCompare(kb.symbol);
  });
}

export function formatFormula(composition: Record<string, number>): string {
  const normalized = new Map<string, number>();
  for (const [rawSymbol, rawCount] of Object.entries(composition)) {
    const count = Number.parseInt(String(rawCount), 10);
    if (count < 0) throw new Error("formula counts must be non-negative");
    if (!count) continue;
    const symbol = normalizeSpeciesLabel(rawSymbol);
    normalized.set(symbol, (normalized.get(symbol) || 0) + count);
  }

  const parts: string[] = [];
  for (const symbol of hillSortSymbols(normalized.keys())) {
    const count = normalized.get(symbol) || 0;
    if (!count) continue;
    const label = displaySpeciesLabel(symbol);
    parts.push(count === 1 ? label : `${label}${count}`);
  }
  return parts.join("") || "0";
}

export function parseCharge(charge: ChargeSpec): number {
  if (charge === null || charge === undefined || String(charge).trim() === "") {
    throw new Error("charge is required and must not be empty");
  }
  if (Number.isInteger(charge)) {
    if (charge === 0) throw new Error("charge must not be zero");
    return Number(charge);
  }

  const text = String(charge).trim();
  let value: number;
  if (["+", "+1", "1+"].includes(text)) value = 1;
  else if (["-", "-1", "1-"].includes(text)) value = -1;
  else if (/^\d+\+$/.test(text)) value = Number.parseInt(text.slice(0, -1), 10);
  else if (/^\d+-$/.test(text)) value = -Number.parseInt(text.slice(0, -1), 10);
  else if (/^[+-]?\d+$/.test(text)) value = Number.parseInt(text, 10);
  else throw new Error(`invalid charge value ${charge}`);

  if (!Number.isSafeInteger(value) || value === 0) throw new Error("charge must be a non-zero safe integer");
  return value;
}

export function formatChargeState(charge: ChargeSpec): string {
  const value = parseCharge(charge);
  const magnitude = Math.abs(value);
  const sign = value > 0 ? "+" : "-";
  return magnitude === 1 ? sign : `${magnitude}${sign}`;
}

export function formatIonFormula(formula: string, charge: ChargeSpec): string {
  return `[${formula}]${formatChargeState(charge)}`;
}
