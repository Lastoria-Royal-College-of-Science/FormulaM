import { describe, expect, it } from "vitest";
import { createDefaultSearchForm, hasCommittedCharges, hasEnabledTolerance, selectedCharges, selectedTolerance } from "../../src/core/search/searchForm";

describe("search form tolerance helpers", () => {
  it("defaults to a committed +1 charge and seeds the Da value", () => {
    const form = createDefaultSearchForm();

    expect(form.chargeEntries).toEqual([
      { id: "charge-0", text: "1" },
    ]);
    expect(form.chargeSign).toBe("+");
    expect(form.chargeInputText).toBe("");
    expect(selectedCharges(form)).toEqual([1]);
    expect(hasCommittedCharges(form)).toBe(true);
    expect(form.tolerancePpmEnabled).toBe(true);
    expect(form.toleranceDaEnabled).toBe(false);
    expect(form.tolerancePpm).toBe("5");
    expect(form.toleranceDa).toBe("0.01");
  });

  it("expands charge ranges with the shared charge sign", () => {
    const form = createDefaultSearchForm();
    form.chargeEntries = [
      { id: "charge-1", text: "2-4" },
      { id: "charge-2", text: "1" },
    ];
    form.chargeSign = "-";

    expect(selectedCharges(form)).toEqual([-2, -3, -4, -1]);
  });

  it("returns only enabled tolerance constraints", () => {
    const form = createDefaultSearchForm();

    expect(selectedTolerance(form)).toEqual({
      tolerancePpm: "5",
      toleranceDa: null,
    });

    form.tolerancePpmEnabled = false;
    form.toleranceDaEnabled = true;

    expect(selectedTolerance(form)).toEqual({
      tolerancePpm: null,
      toleranceDa: "0.01",
    });
  });

  it("supports applying ppm and Da tolerances together", () => {
    const form = createDefaultSearchForm();
    form.toleranceDaEnabled = true;

    expect(selectedTolerance(form)).toEqual({
      tolerancePpm: "5",
      toleranceDa: "0.01",
    });
  });

  it("requires at least one enabled tolerance", () => {
    const form = createDefaultSearchForm();
    form.tolerancePpmEnabled = false;

    expect(hasEnabledTolerance(form)).toBe(false);
    expect(() => selectedTolerance(form)).toThrow("Enable a ppm tolerance, a Da tolerance, or both.");
  });

  it("requires values for enabled tolerance inputs", () => {
    const form = createDefaultSearchForm();
    form.tolerancePpm = " ";

    expect(() => selectedTolerance(form)).toThrow("Enter a ppm tolerance or switch it off.");

    form.tolerancePpmEnabled = false;
    form.toleranceDaEnabled = true;
    form.toleranceDa = "";

    expect(() => selectedTolerance(form)).toThrow("Enter a Da tolerance or switch it off.");
  });

  it("requires at least one committed charge", () => {
    const form = createDefaultSearchForm();
    form.chargeEntries = [];

    expect(hasCommittedCharges(form)).toBe(false);
    expect(() => selectedCharges(form)).toThrow("Add at least one charge.");
  });
});
