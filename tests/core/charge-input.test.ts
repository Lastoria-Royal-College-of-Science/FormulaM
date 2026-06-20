import { describe, expect, it } from "vitest";
import {
  canCommitChargeEntryText,
  createChargeEntry,
  expandChargeEntries,
  formatChargeEntry,
  formatSignedChargeText,
  isChargeDraftText,
  parseChargeEntryText,
} from "../../src/core/search/chargeInput";

describe("charge input helpers", () => {
  it("accepts draft text for partial integers and ranges", () => {
    expect(isChargeDraftText("")).toBe(true);
    expect(isChargeDraftText("12")).toBe(true);
    expect(isChargeDraftText("12-")).toBe(true);
    expect(isChargeDraftText("12-14")).toBe(true);
    expect(isChargeDraftText("12a")).toBe(false);
    expect(isChargeDraftText("1-2-3")).toBe(false);
  });

  it("parses positive integers and inclusive ranges", () => {
    expect(parseChargeEntryText("7")).toEqual({ text: "7", min: 7, max: 7 });
    expect(parseChargeEntryText("2-4")).toEqual({ text: "2-4", min: 2, max: 4 });
    expect(parseChargeEntryText("114-514")).toEqual({ text: "114-514", min: 114, max: 514 });
  });

  it("rejects incomplete or invalid committed charge values", () => {
    expect(canCommitChargeEntryText("1-")).toBe(false);
    expect(canCommitChargeEntryText("0")).toBe(false);
    expect(canCommitChargeEntryText("4-2")).toBe(false);
  });

  it("formats signless charge tags and expands them with a shared sign", () => {
    const entries = [
      createChargeEntry("charge-1", "1"),
      createChargeEntry("charge-2", "2-3"),
      createChargeEntry("charge-3", "3"),
    ];

    expect(formatChargeEntry(entries[1])).toBe("2-3");
    expect(formatSignedChargeText("+", entries[1].text)).toBe("+2-3");
    expect(expandChargeEntries(entries, "+")).toEqual([1, 2, 3]);
    expect(expandChargeEntries(entries, "-")).toEqual([-1, -2, -3]);
  });

  it("accepts wide charge ranges that remain numerically valid", () => {
    expect(canCommitChargeEntryText("114-514")).toBe(true);
    expect(expandChargeEntries([createChargeEntry("charge-114-514", "114-514")], "+")).toHaveLength(401);
  });
});
