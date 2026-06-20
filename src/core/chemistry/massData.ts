import { normalizeSpeciesLabel } from "./formula";
import type { AliasRecord, IsotopeRecord, MassIndex, MassPayload } from "../types";

export const MASS_DATA_CANDIDATES = [
  "data/masses.json",
  "masses.json",
  "ms_formula_finder/data/masses.json",
] as const;

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

function resolveAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function superscriptDigits(text: string): string {
  return text.replace(/\d/g, (digit) => SUPERSCRIPT_DIGITS[digit] ?? digit);
}

function formatIsotopeDisplayLabel(label: string): string {
  const match = label.match(/^(\d+)([A-Z][a-z]?)$/);
  return match ? `${superscriptDigits(match[1])}${match[2]}` : label;
}

export async function loadMassPayload(urls: readonly string[] = MASS_DATA_CANDIDATES): Promise<{ payload: MassPayload; url: string }> {
  const errors: string[] = [];
  for (const path of urls) {
    const url = resolveAssetPath(path);
    try {
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const payload = await response.json() as MassPayload;
      return { payload, url };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${url}: ${message}`);
    }
  }
  throw new Error(`Could not load masses.json. Tried: ${errors.join("; ")}`);
}

export function buildMassIndex(payload: MassPayload): MassIndex {
  if (!payload || typeof payload !== "object") throw new Error("mass payload must be an object");
  const isotopes = payload.isotopes ?? {};
  const defaultIsotopeBySymbol = payload.default_isotope_by_symbol ?? {};
  const aliases = payload.aliases ?? {};

  const masses: Record<string, string> = {};
  for (const [label, record] of Object.entries(isotopes)) {
    masses[normalizeSpeciesLabel(label)] = String(record.exact_mass);
  }
  for (const [symbol, isotopeLabel] of Object.entries(defaultIsotopeBySymbol)) {
    const canonical = normalizeSpeciesLabel(isotopeLabel);
    const record = isotopes[canonical];
    if (!record) continue;
    masses[symbol] = String(record.exact_mass);
  }
  for (const [alias, record] of Object.entries(aliases)) {
    const target = normalizeSpeciesLabel(record.target);
    const isotope = isotopes[target];
    if (!isotope) continue;
    masses[alias] = String(isotope.exact_mass);
  }

  const isotopeOptions: Record<string, string[]> = {};
  for (const symbol of Object.keys(defaultIsotopeBySymbol)) isotopeOptions[symbol] = [];
  for (const [label, record] of Object.entries(isotopes)) {
    const symbol = String(record.symbol);
    if (!(symbol in isotopeOptions)) continue;
    const canonical = normalizeSpeciesLabel(label);
    const isDefault = canonical === defaultIsotopeBySymbol[symbol];
    if (record.abundance !== null && record.abundance !== undefined || isDefault) {
      isotopeOptions[symbol]?.push(canonical);
    }
  }
  for (const [symbol, labels] of Object.entries(isotopeOptions)) {
    labels.sort((a, b) => Number((isotopes[a] as IsotopeRecord | undefined)?.mass_number ?? 0) - Number((isotopes[b] as IsotopeRecord | undefined)?.mass_number ?? 0));
    isotopeOptions[symbol] = labels;
  }

  return {
    meta: payload._meta ?? {},
    isotopes,
    defaultIsotopeBySymbol,
    aliases: aliases as Record<string, AliasRecord>,
    masses,
    isotopeOptions,
    elementSymbols: Object.keys(defaultIsotopeBySymbol),
  };
}

export function defaultIsotopeLabel(massIndex: MassIndex, symbol: string): string {
  const label = massIndex.defaultIsotopeBySymbol[symbol];
  if (!label) throw new Error(`unknown element symbol ${symbol}`);
  return label;
}

export function formatIsotopeOption(massIndex: MassIndex, label: string): string {
  const canonical = normalizeSpeciesLabel(label);
  const record = massIndex.isotopes[canonical];
  const displayLabel = formatIsotopeDisplayLabel(canonical);
  if (!record) return displayLabel;
  return massIndex.defaultIsotopeBySymbol[record.symbol] === canonical ? `${displayLabel} (default)` : displayLabel;
}

export function elementCapacity(massIndex: MassIndex, symbol: string): number {
  return massIndex.isotopeOptions[symbol]?.length ?? 0;
}
