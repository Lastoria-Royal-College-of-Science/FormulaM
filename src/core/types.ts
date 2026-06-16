export type ChargeSpec = string | number;
export type ChargeSign = "+" | "-";
export type CountBound = [number, number];
export type ElementBounds = Record<string, CountBound>;
export type SearchElements = ElementBounds;
export type ThemeName = "dark" | "light";
export type AppStatus = "loading" | "idle" | "running" | "success" | "error";
export type PlotLabelMode = "formula" | "mz" | "formula+mz";
export type PlotLabelFilter = "none" | "assigned-only" | "threshold" | "both";

export interface ChargeEntry {
  id: string;
  text: string;
}

export interface SearchFormState {
  mz: string;
  chargeEntries: ChargeEntry[];
  chargeSign: ChargeSign;
  chargeInputText: string;
  chargeEditId: string | null;
  chargeEditText: string;
  tolerancePpmEnabled: boolean;
  toleranceDaEnabled: boolean;
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

export interface PeakAssignment {
  peakId: string;
  mz: number;
  intensity: number;
  relativeIntensity: number;
  formula: string;
  ionFormula?: string;
  predictedMz?: number;
  errorDa?: number;
  errorPpm?: number;
  source: "formula-search" | "manual";
}

export interface SpectrumPeak {
  id: string;
  mz: number;
  intensity: number;
  relativeIntensity: number;
  selected?: boolean;
  assignments?: PeakAssignment[];
}

export interface PlotSettings {
  xMin?: number;
  xMax?: number;
  yScale: "auto" | "fixed";
  yMax?: number;
  thresholdEnabled: boolean;
  thresholdPercent: number;
  autoTicks: boolean;
  majorTickSpacing?: number;
  minorTickSpacing?: number;
  peakColor: string;
  selectedPeakColor: string;
  assignedPeakColor: string;
  lineWidth: number;
  showLabels: boolean;
  showPeakMzLabels: boolean;
  showFormulaLabels: boolean;
  labelMode: PlotLabelMode;
  labelFilter: PlotLabelFilter;
}

export interface SpectrumImportResult {
  peaks: SpectrumPeak[];
  mzColumn: string;
  intensityColumn: string;
  sourceName: string;
}

export interface SpectrumImportSheet {
  name: string;
  table: unknown[][];
  columnCount: number;
  rowCount: number;
  suggestedHasHeaderRow: boolean;
  suggestedMzColumnIndex: number | null;
  suggestedIntensityColumnIndex: number | null;
}

export interface SpectrumImportSource {
  sourceName: string;
  sheets: SpectrumImportSheet[];
}

export interface SpectrumPreviewTable {
  columnLabels: string[];
  rows: string[][];
  totalRows: number;
}

export interface SpectrumImportSelection {
  sheetName: string;
  hasHeaderRow: boolean;
  mzColumnIndex: number | null;
  intensityColumnIndex: number | null;
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

export interface FormulaSearchRequest {
  mz: string | number;
  elements: SearchElements | string[];
  charges: ChargeSpec[];
  toleranceDa?: string | number | null;
  tolerancePpm?: string | number | null;
  maxResults?: number | null;
  massIndex: MassIndex;
  massDigits?: number;
}
