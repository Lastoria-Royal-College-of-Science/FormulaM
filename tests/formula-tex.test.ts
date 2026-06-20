import katex from "katex";
import "katex/contrib/mhchem";
import { describe, expect, it } from "vitest";
import { formulaToMhchemTex, tryFormulaToMhchemTex } from "../src/core/chemistry/formulaTex";

const examples = [
  ["C6H12O6", "\\ce{C6H12O6}"],
  ["[C6H12O6]+", "\\ce{[C6H12O6]+}"],
  ["[C6H12O6]2+", "\\ce{[C6H12O6]^2+}"],
  ["[C6H12O6]-", "\\ce{[C6H12O6]-}"],
  ["[C6H12O6]2-", "\\ce{[C6H12O6]^2-}"],
  ["C5[13C]H12O6", "\\ce{C5{}^{13}CH12O6}"],
  ["[C5[13C]H12O6]2+", "\\ce{[C5{}^{13}CH12O6]^2+}"],
  ["D2T", "\\ce{D2T}"],
] as const;

describe("formula mhchem TeX conversion", () => {
  it("converts FormulaM formula strings to mhchem TeX", () => {
    for (const [formula, tex] of examples) {
      expect(formulaToMhchemTex(formula)).toBe(tex);
    }
  });

  it("generates KaTeX-renderable mhchem strings", () => {
    for (const [, tex] of examples) {
      expect(katex.renderToString(tex, { output: "htmlAndMathml", throwOnError: true })).toContain("katex");
    }
  });

  it("returns null for unsupported display syntax in fallback paths", () => {
    expect(tryFormulaToMhchemTex("C6H12O6;")).toBeNull();
    expect(tryFormulaToMhchemTex("C6]")).toBeNull();
    expect(() => formulaToMhchemTex("")).toThrow("Formula cannot be empty.");
  });
});
