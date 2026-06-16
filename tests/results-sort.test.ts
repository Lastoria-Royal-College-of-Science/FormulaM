import { describe, expect, it } from "vitest";
import {
  cycleResultSortState,
  getResultSortAria,
  getResultSortIconClass,
  sortFormulaHits,
} from "../src/core/resultsSort";
import type { FormulaHit } from "../src/core/types";

const hits: FormulaHit[] = [
  {
    formula: "A",
    composition: { C: 1 },
    mass: "10.5",
    mz: "3.4",
    error_da: "-0.200000000",
    error_ppm: "5.000000",
    charge: 1,
    charge_state: "+",
    ion_formula: "[A]+",
  },
  {
    formula: "B",
    composition: { H: 2 },
    mass: "2.2",
    mz: "20.1",
    error_da: "0.100000000",
    error_ppm: "-7.000000",
    charge: 1,
    charge_state: "+",
    ion_formula: "[B]+",
  },
  {
    formula: "C",
    composition: { O: 3 },
    mass: "5.0",
    mz: "1.2",
    error_da: "0.050000000",
    error_ppm: "0.000000",
    charge: 1,
    charge_state: "+",
    ion_formula: "[C]+",
  },
];

describe("sortFormulaHits", () => {
  it("preserves the original order when no sort state is active", () => {
    expect(sortFormulaHits(hits, null)).toBe(hits);
  });

  it("sorts neutral mass and predicted m/z numerically in both directions", () => {
    expect(sortFormulaHits(hits, { column: "mass", direction: "asc" }).map((hit) => hit.formula)).toEqual(["B", "C", "A"]);
    expect(sortFormulaHits(hits, { column: "mass", direction: "desc" }).map((hit) => hit.formula)).toEqual(["A", "C", "B"]);
    expect(sortFormulaHits(hits, { column: "mz", direction: "asc" }).map((hit) => hit.formula)).toEqual(["C", "A", "B"]);
    expect(sortFormulaHits(hits, { column: "mz", direction: "desc" }).map((hit) => hit.formula)).toEqual(["B", "A", "C"]);
  });

  it("sorts error columns by absolute error while preserving the displayed sign", () => {
    expect(sortFormulaHits(hits, { column: "error_da", direction: "asc" }).map((hit) => hit.formula)).toEqual(["C", "B", "A"]);
    expect(sortFormulaHits(hits, { column: "error_da", direction: "desc" }).map((hit) => hit.formula)).toEqual(["A", "B", "C"]);
    expect(sortFormulaHits(hits, { column: "error_ppm", direction: "asc" }).map((hit) => hit.formula)).toEqual(["C", "A", "B"]);
    expect(sortFormulaHits(hits, { column: "error_ppm", direction: "desc" }).map((hit) => hit.formula)).toEqual(["B", "A", "C"]);
  });

  it("cycles sort state as SORT to ASC to DESC to SORT", () => {
    const asc = cycleResultSortState(null, "mass");
    const desc = cycleResultSortState(asc, "mass");
    const reset = cycleResultSortState(desc, "mass");

    expect(asc).toEqual({ column: "mass", direction: "asc" });
    expect(desc).toEqual({ column: "mass", direction: "desc" });
    expect(reset).toBeNull();
  });

  it("resets the previous column when a new column is selected", () => {
    const next = cycleResultSortState({ column: "mass", direction: "desc" }, "mz");

    expect(next).toEqual({ column: "mz", direction: "asc" });
    expect(getResultSortAria(next, "mass")).toBe("none");
    expect(getResultSortIconClass(next, "mass")).toBe("i-typcn-arrow-unsorted");
  });

  it("maps the active state to the requested UnoCSS icon classes", () => {
    expect(getResultSortIconClass(null, "mass")).toBe("i-typcn-arrow-unsorted");
    expect(getResultSortIconClass({ column: "mass", direction: "asc" }, "mass")).toBe("i-typcn-arrow-sorted-up");
    expect(getResultSortIconClass({ column: "mass", direction: "desc" }, "mass")).toBe("i-typcn-arrow-sorted-down");
  });
});
