export interface MassDataMeta extends Record<string, unknown> {
  description: string;
  isotope_source: string;
  isotope_reference: string;
  default_selection_source: string;
  default_selection_source_url: string;
  radioactive_selection_source: string;
  radioactive_selection_source_url: string;
  isotope_record_count: number;
  default_element_count: number;
  alias_count: number;
  created_for_package_version: string;
}

export interface IsotopeRecord extends Record<string, unknown> {
  atomic_number: number;
  symbol: string;
  mass_number: number;
  exact_mass: string;
  abundance: string | number | null;
}

export interface AliasRecord extends Record<string, unknown> {
  target: string;
  symbol: string;
  mass_number: number;
  isotope_name?: string;
  selection?: string;
}

export interface MassPayload {
  _meta: MassDataMeta;
  aliases: Record<string, AliasRecord>;
  default_isotope_by_symbol: Record<string, string>;
  isotopes: Record<string, IsotopeRecord>;
}
