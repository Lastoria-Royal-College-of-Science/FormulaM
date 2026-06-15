import { createChargeEntry, expandChargeEntries } from "./chargeInput";
import type { ChargeSpec, SearchFormState } from "./types";

export function createDefaultSearchForm(): SearchFormState {
  return {
    mz: "180.062839518",
    chargeEntries: [createChargeEntry("charge-0", "1")],
    chargeSign: "+",
    chargeInputText: "",
    chargeEditId: null,
    chargeEditText: "",
    tolerancePpmEnabled: true,
    toleranceDaEnabled: false,
    tolerancePpm: "5",
    toleranceDa: "0.01",
    maxResults: 100,
  };
}

export function hasCommittedCharges(form: SearchFormState): boolean {
  return form.chargeEntries.length > 0;
}

export function selectedCharges(form: SearchFormState): ChargeSpec[] {
  if (!form.chargeEntries.length) {
    throw new Error("Add at least one charge.");
  }

  const charges = expandChargeEntries(form.chargeEntries, form.chargeSign);
  if (!charges.length) {
    throw new Error("Add at least one valid charge.");
  }

  return charges;
}

export function hasEnabledTolerance(form: SearchFormState): boolean {
  return form.tolerancePpmEnabled || form.toleranceDaEnabled;
}

export function selectedTolerance(form: SearchFormState): { tolerancePpm: string | null; toleranceDa: string | null } {
  const ppmText = form.tolerancePpm.trim();
  const daText = form.toleranceDa.trim();

  if (form.tolerancePpmEnabled && !ppmText) {
    throw new Error("Enter a ppm tolerance or switch it off.");
  }

  if (form.toleranceDaEnabled && !daText) {
    throw new Error("Enter a Da tolerance or switch it off.");
  }

  const tolerancePpm = form.tolerancePpmEnabled ? ppmText : null;
  const toleranceDa = form.toleranceDaEnabled ? daText : null;

  if (tolerancePpm === null && toleranceDa === null) {
    throw new Error("Enable a ppm tolerance, a Da tolerance, or both.");
  }

  return { tolerancePpm, toleranceDa };
}
