import type { MassPayload } from "./types";

type UnknownRecord = Record<string, unknown>;

const ELEMENT_SYMBOL_PATTERN = /^[A-Z][a-z]?$/;
const REQUIRED_SOURCE_FIELDS = [
  "description",
  "isotope_source",
  "isotope_reference",
  "default_selection_source",
  "default_selection_source_url",
  "radioactive_selection_source",
  "radioactive_selection_source_url",
  "created_for_package_version",
] as const;

function invalid(path: string, message: string): never {
  throw new Error(`Invalid mass data at ${path}: ${message}`);
}

function requireRecord(value: unknown, path: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid(path, "expected an object");
  }
  return value as UnknownRecord;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    invalid(path, "expected a non-empty string");
  }
  return value;
}

function requirePositiveInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    invalid(path, "expected a positive integer");
  }
  return value;
}

function requirePositiveNumericString(value: unknown, path: string): string {
  const text = requireString(value, path);
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    invalid(path, "expected a finite positive numeric string");
  }
  return text;
}

function requireAbundance(value: unknown, path: string): void {
  if (value === null) return;
  if (typeof value !== "string" && typeof value !== "number") {
    invalid(path, "expected null or a numeric value between 0 and 1");
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    invalid(path, "expected null or a numeric value between 0 and 1");
  }
}

function requireMetadataCount(meta: UnknownRecord, field: string, actual: number): void {
  const declared = requirePositiveInteger(meta[field], `_meta.${field}`);
  if (declared !== actual) {
    invalid(`_meta.${field}`, `declares ${declared}, but found ${actual}`);
  }
}

export function validateMassPayload(value: unknown): asserts value is MassPayload {
  const payload = requireRecord(value, "payload");
  const meta = requireRecord(payload["_meta"], "_meta");
  const aliases = requireRecord(payload.aliases, "aliases");
  const defaults = requireRecord(payload.default_isotope_by_symbol, "default_isotope_by_symbol");
  const isotopes = requireRecord(payload.isotopes, "isotopes");

  for (const field of REQUIRED_SOURCE_FIELDS) {
    requireString(meta[field], `_meta.${field}`);
  }

  const isotopeRecords = new Map<
    string,
    { atomicNumber: number; massNumber: number; symbol: string }
  >();
  const atomicNumberBySymbol = new Map<string, number>();

  for (const [label, rawRecord] of Object.entries(isotopes)) {
    const record = requireRecord(rawRecord, `isotopes.${label}`);
    const atomicNumber = requirePositiveInteger(
      record.atomic_number,
      `isotopes.${label}.atomic_number`,
    );
    const symbol = requireString(record.symbol, `isotopes.${label}.symbol`);
    if (!ELEMENT_SYMBOL_PATTERN.test(symbol)) {
      invalid(`isotopes.${label}.symbol`, `invalid element symbol ${symbol}`);
    }
    const massNumber = requirePositiveInteger(record.mass_number, `isotopes.${label}.mass_number`);
    requirePositiveNumericString(record.exact_mass, `isotopes.${label}.exact_mass`);
    requireAbundance(record.abundance, `isotopes.${label}.abundance`);

    const expectedLabel = `${massNumber}${symbol}`;
    if (label !== expectedLabel) {
      invalid(`isotopes.${label}`, `record fields require label ${expectedLabel}`);
    }

    const knownAtomicNumber = atomicNumberBySymbol.get(symbol);
    if (knownAtomicNumber !== undefined && knownAtomicNumber !== atomicNumber) {
      invalid(`isotopes.${label}.atomic_number`, `inconsistent atomic number for ${symbol}`);
    }
    atomicNumberBySymbol.set(symbol, atomicNumber);
    isotopeRecords.set(label, { atomicNumber, massNumber, symbol });
  }

  for (const [symbol, rawTarget] of Object.entries(defaults)) {
    if (!ELEMENT_SYMBOL_PATTERN.test(symbol)) {
      invalid(`default_isotope_by_symbol.${symbol}`, "invalid element symbol");
    }
    const target = requireString(rawTarget, `default_isotope_by_symbol.${symbol}`);
    const isotope = isotopeRecords.get(target);
    if (!isotope) {
      invalid(`default_isotope_by_symbol.${symbol}`, `unknown isotope ${target}`);
    }
    if (isotope.symbol !== symbol) {
      invalid(`default_isotope_by_symbol.${symbol}`, `${target} belongs to ${isotope.symbol}`);
    }
  }

  for (const [alias, rawAlias] of Object.entries(aliases)) {
    const record = requireRecord(rawAlias, `aliases.${alias}`);
    const target = requireString(record.target, `aliases.${alias}.target`);
    const isotope = isotopeRecords.get(target);
    if (!isotope) invalid(`aliases.${alias}.target`, `unknown isotope ${target}`);

    const symbol = requireString(record.symbol, `aliases.${alias}.symbol`);
    const massNumber = requirePositiveInteger(record.mass_number, `aliases.${alias}.mass_number`);
    if (symbol !== isotope.symbol || massNumber !== isotope.massNumber) {
      invalid(`aliases.${alias}`, `metadata does not match target ${target}`);
    }
  }

  requireMetadataCount(meta, "isotope_record_count", isotopeRecords.size);
  requireMetadataCount(meta, "default_element_count", Object.keys(defaults).length);
  requireMetadataCount(meta, "alias_count", Object.keys(aliases).length);

  const deuterium = requireRecord(aliases.D, "aliases.D");
  const tritium = requireRecord(aliases.T, "aliases.T");
  if (deuterium.target !== "2H") invalid("aliases.D.target", "expected 2H");
  if (tritium.target !== "3H") invalid("aliases.T.target", "expected 3H");
}
