export type ChargeSpec = string | number;
export type CountBound = [number, number];
export type ElementBounds = Record<string, CountBound>;
export type SearchElements = ElementBounds;
export type ToleranceMode = "ppm" | "Da" | "both";
export type ThemeName = "dark" | "light";
export type AppStatus = "loading" | "idle" | "running" | "success" | "error";

export interface SearchFormState {
  mz: string;
  charge: string;
  toleranceMode: ToleranceMode;
  tolerancePpm: string;
  toleranceDa: string;
  maxResults: number;
}

export interface FormulaSpaceRow {
  id: number;
  element: string;
  isotope: string;
  lower: number | "";
  upper: number | "";
}

export interface IsotopeRecord {
  symbol: string;
  atomic_number?: number;
  mass_number: number | string;
  exact_mass: number | string;
  abundance?: number | null;
  [key: string]: unknown;
}

export type MassRecord = IsotopeRecord;

export interface AliasRecord {
  target: string;
  symbol?: string;
  mass_number?: number | string;
  isotope_name?: string;
  selection?: string;
  [key: string]: unknown;
}

export interface MassPayload {
  _meta?: Record<string, unknown>;
  aliases?: Record<string, AliasRecord>;
  default_isotope_by_symbol: Record<string, string>;
  isotopes: Record<string, IsotopeRecord>;
}

export interface MassIndex {
  meta: Record<string, unknown>;
  aliases: Record<string, AliasRecord>;
  defaultIsotopeBySymbol: Record<string, string>;
  elementSymbols: string[];
  isotopeOptions: Record<string, string[]>;
  isotopes: Record<string, IsotopeRecord>;
  masses: Record<string, string>;
}

export interface FormulaHit {
  formula: string;
  composition: Record<string, number>;
  mass: string;
  mz: string;
  error_da: string;
  error_ppm: string;
  charge: number;
  charge_state: string;
  ion_formula: string;
}

export interface FindFormulaRequest {
  mz: string | number;
  elements: SearchElements | string[];
  charge: ChargeSpec;
  toleranceDa?: string | number | null;
  tolerancePpm?: string | number | null;
  maxResults?: number | null;
  massIndex: MassIndex;
  massDigits?: number;
}
