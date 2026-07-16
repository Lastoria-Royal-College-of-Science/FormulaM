import { describe, expect, it } from "vitest";

import { tokenizeFormulaDisplay } from "../../src/core/chemistry/formulaDisplay";

describe("formula display tokens", () => {
  it("renders element counts as subscripts and charges as superscripts", () => {
    expect(tokenizeFormulaDisplay("[C6H12O6]+")).toEqual([
      { kind: "text", text: "[" },
      { kind: "text", text: "C" },
      { kind: "sub", text: "6" },
      { kind: "text", text: "H" },
      { kind: "sub", text: "12" },
      { kind: "text", text: "O" },
      { kind: "sub", text: "6" },
      { kind: "text", text: "]" },
      { kind: "sup", text: "+" },
    ]);
  });

  it("renders isotope mass labels as superscripts", () => {
    expect(tokenizeFormulaDisplay("[C5[13C]H12O6]2+")).toContainEqual({
      kind: "isotope",
      massNumber: "13",
      element: "C",
    });
    expect(tokenizeFormulaDisplay("[C5[13C]H12O6]2+")).toContainEqual({ kind: "sup", text: "2+" });
  });

  it("omits isotope-local brackets while preserving dense isotope formulas", () => {
    expect(tokenizeFormulaDisplay("[C6[13C]H2[15N]2[18O]2]+")).toEqual([
      { kind: "text", text: "[" },
      { kind: "text", text: "C" },
      { kind: "sub", text: "6" },
      { kind: "isotope", massNumber: "13", element: "C" },
      { kind: "text", text: "H" },
      { kind: "sub", text: "2" },
      { kind: "isotope", massNumber: "15", element: "N" },
      { kind: "sub", text: "2" },
      { kind: "isotope", massNumber: "18", element: "O" },
      { kind: "sub", text: "2" },
      { kind: "text", text: "]" },
      { kind: "sup", text: "+" },
    ]);
  });
});
