import { describe, expect, it } from "vitest";

import { validateMassPayload, type MassPayload } from "../src/index";
import masses from "../src/masses.json";

function clonePayload(): MassPayload {
  return structuredClone(masses) as MassPayload;
}

describe("bundled mass data", () => {
  it("satisfies the package schema and scientific reference checks", () => {
    const payload: unknown = masses;
    expect(() => validateMassPayload(payload)).not.toThrow();
    validateMassPayload(payload);

    expect(payload["_meta"].isotope_record_count).toBe(Object.keys(payload.isotopes).length);
    expect(payload["_meta"].default_element_count).toBe(
      Object.keys(payload.default_isotope_by_symbol).length,
    );
    expect(payload["_meta"].alias_count).toBe(Object.keys(payload.aliases).length);
    expect(payload.aliases.D.target).toBe("2H");
    expect(payload.aliases.T.target).toBe("3H");
    expect(payload.isotopes["1H"]?.exact_mass).toBe("1.0078250319000");
    expect(payload.isotopes["12C"]?.exact_mass).toBe("12.0");
    expect(payload.isotopes["16O"]?.exact_mass).toBe("15.994914619300");
  });

  it.each([
    [
      "invalid exact masses",
      (payload: MassPayload) => {
        payload.isotopes["1H"]!.exact_mass = "not-a-number";
      },
    ],
    [
      "out-of-range abundances",
      (payload: MassPayload) => {
        payload.isotopes["1H"]!.abundance = "1.1";
      },
    ],
    [
      "unknown default isotope targets",
      (payload: MassPayload) => {
        payload.default_isotope_by_symbol.H = "999H";
      },
    ],
    [
      "inconsistent metadata counts",
      (payload: MassPayload) => {
        payload["_meta"].isotope_record_count -= 1;
      },
    ],
    [
      "incorrect D aliases",
      (payload: MassPayload) => {
        payload.aliases.D!.target = "3H";
      },
    ],
    [
      "mismatched isotope labels",
      (payload: MassPayload) => {
        payload.isotopes["999H"] = payload.isotopes["1H"]!;
        delete payload.isotopes["1H"];
      },
    ],
  ])("rejects %s", (_name, mutate) => {
    const payload = clonePayload();
    mutate(payload);
    expect(() => validateMassPayload(payload)).toThrow("Invalid mass data");
  });
});
