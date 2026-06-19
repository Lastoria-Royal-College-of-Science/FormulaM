import type { ChargeEntry, ChargeSign } from "../types";

const CHARGE_DRAFT_RE = /^\d*(?:-\d*)?$/;
const CHARGE_ENTRY_RE = /^(\d+)(?:-(\d+))?$/;

export function isChargeDraftText(text: string): boolean {
  return CHARGE_DRAFT_RE.test(text);
}

export function parseChargeEntryText(rawText: string): { text: string; min: number; max: number } {
  const text = rawText.trim();
  if (!text) throw new Error("Charge value is required.");

  const match = text.match(CHARGE_ENTRY_RE);
  if (!match) throw new Error("Charge must be a positive integer or a range like 2-4.");

  const min = Number.parseInt(match[1], 10);
  const max = match[2] ? Number.parseInt(match[2], 10) : min;
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
    throw new Error("Charge must be a safe integer.");
  }
  if (min < 1 || max < 1) {
    throw new Error("Charge must be greater than zero.");
  }
  if (min > max) {
    throw new Error("Charge range minimum must not exceed the maximum.");
  }

  return { text, min, max };
}

export function canCommitChargeEntryText(text: string): boolean {
  try {
    parseChargeEntryText(text);
    return true;
  } catch {
    return false;
  }
}

export function createChargeEntry(id: string, text: string): ChargeEntry {
  const parsed = parseChargeEntryText(text);
  return {
    id,
    text: parsed.text,
  };
}

export function formatChargeEntry(entry: Pick<ChargeEntry, "text">): string {
  return entry.text;
}

export function formatSignedChargeText(sign: ChargeSign, text: string): string {
  return `${sign}${text}`;
}

export function expandChargeEntry(entry: Pick<ChargeEntry, "text">, sign: ChargeSign): number[] {
  const { min, max } = parseChargeEntryText(entry.text);
  const direction = sign === "+" ? 1 : -1;
  const charges: number[] = [];
  for (let value = min; value <= max; value += 1) {
    charges.push(direction * value);
  }
  return charges;
}

export function expandChargeEntries(entries: Array<Pick<ChargeEntry, "text">>, sign: ChargeSign): number[] {
  const seen = new Set<number>();
  const charges: number[] = [];

  for (const entry of entries) {
    for (const charge of expandChargeEntry(entry, sign)) {
      if (seen.has(charge)) continue;
      seen.add(charge);
      charges.push(charge);
    }
  }

  return charges;
}
