import { describe, expect, it } from "vitest";
import { tokenizeFormulaDisplay } from "../src/core/formulaDisplay";

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
    expect(tokenizeFormulaDisplay("[C5[13C]H12O6]2+")).toContainEqual({ kind: "sup", text: "13" });
    expect(tokenizeFormulaDisplay("[C5[13C]H12O6]2+")).toContainEqual({ kind: "sup", text: "2+" });
  });
});
