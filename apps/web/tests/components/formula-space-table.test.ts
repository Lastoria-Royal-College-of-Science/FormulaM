import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import FormulaSpaceTable from "../../src/components/search/FormulaSpaceTable.svelte";
import { buildMassIndex, formatIsotopeOption } from "../../src/core/chemistry/massData";
import type { FormulaSpaceRow, MassPayload } from "../../src/core/types";
import { enabledInteractiveControlsWithTitles } from "./titleAssertions";

const massPayload: MassPayload = {
  default_isotope_by_symbol: {
    C: "12C",
    O: "16O",
  },
  isotopes: {
    "12C": { symbol: "C", mass_number: 12, exact_mass: "12", abundance: 0.9893 },
    "13C": { symbol: "C", mass_number: 13, exact_mass: "13.003354835", abundance: 0.0107 },
    "16O": { symbol: "O", mass_number: 16, exact_mass: "15.99491462", abundance: 0.99757 },
    "17O": { symbol: "O", mass_number: 17, exact_mass: "16.99913176", abundance: 0.00038 },
    "18O": { symbol: "O", mass_number: 18, exact_mass: "17.99915961", abundance: 0.00205 },
  },
};

const massIndex = buildMassIndex(massPayload);

describe("formatIsotopeOption", () => {
  it("renders isotope mass numbers with Unicode superscripts", () => {
    expect(formatIsotopeOption(massIndex, "12C")).toBe("¹²C (default)");
    expect(formatIsotopeOption(massIndex, "13C")).toBe("¹³C");
    expect(formatIsotopeOption(massIndex, "16O")).toBe("¹⁶O (default)");
    expect(formatIsotopeOption(massIndex, "17O")).toBe("¹⁷O");
    expect(formatIsotopeOption(massIndex, "18O")).toBe("¹⁸O");
  });
});

describe("FormulaSpaceTable", () => {
  it("shows superscript isotope labels while preserving canonical option values", () => {
    const rows: FormulaSpaceRow[] = [{ id: 1, element: "O", isotope: "16O", lower: 0, upper: 20 }];

    const { body } = render(FormulaSpaceTable, {
      props: {
        rows,
        massIndex,
        onAddRow: () => undefined,
        onRemoveRow: () => undefined,
        onUpdateRow: () => undefined,
      },
    });

    expect(body).toContain('value="16O"');
    expect(body).toContain(">¹⁶O (default)</option>");
    expect(body).toContain('value="17O"');
    expect(body).toContain(">¹⁷O</option>");
    expect(body).toContain('value="18O"');
    expect(body).toContain(">¹⁸O</option>");
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
    expect(body).not.toContain(">16O (default)</option>");
  });

  it("explains disabled row actions", () => {
    const rows: FormulaSpaceRow[] = [{ id: 1, element: "O", isotope: "16O", lower: 0, upper: 20 }];
    const { body } = render(FormulaSpaceTable, {
      props: {
        rows,
        massIndex,
        onAddRow: () => undefined,
        onRemoveRow: () => undefined,
        onUpdateRow: () => undefined,
      },
    });

    expect(body).toContain('title="Keep at least one formula search-space row."');
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
  });

  it("omits titles from enabled formula-space row actions", () => {
    const rows: FormulaSpaceRow[] = [
      { id: 1, element: "O", isotope: "16O", lower: 0, upper: 20 },
      { id: 2, element: "O", isotope: "17O", lower: 0, upper: 20 },
      { id: 3, element: "O", isotope: "18O", lower: 0, upper: 20 },
      { id: 4, element: "C", isotope: "12C", lower: 0, upper: 20 },
      { id: 5, element: "C", isotope: "13C", lower: 0, upper: 20 },
    ];
    const { body } = render(FormulaSpaceTable, {
      props: {
        rows,
        massIndex,
        onAddRow: () => undefined,
        onRemoveRow: () => undefined,
        onUpdateRow: () => undefined,
      },
    });

    expect(body).toContain('title="All available element/isotope rows are already present."');
    expect(body).not.toContain('title="Remove row"');
    expect(body).not.toContain('title="Add row"');
    expect(enabledInteractiveControlsWithTitles(body)).toEqual([]);
  });
});
