import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { buildMassIndex } from "../../src/core/chemistry/massData";
import { findFormulae, findFormulaeForCharges } from "../../src/core/search/search";
import type { FormulaSearchRequest, MassPayload } from "../../src/core/types";

const payload = JSON.parse(await readFile(new URL("../../public/data/masses.json", import.meta.url), "utf8")) as MassPayload;
const massIndex = buildMassIndex(payload);

describe("batched charge searches", () => {
  it("matches the single-charge result when duplicates collapse to one resolved charge", () => {
    const single = findFormulae({
      mz: "90.031145469",
      elements: { C: [0, 12], H: [0, 30], O: [0, 12] },
      charge: "+2",
      tolerancePpm: "5",
      maxResults: 10,
      massIndex,
    });

    const batch: FormulaSearchRequest = {
      mz: "90.031145469",
      elements: { C: [0, 12], H: [0, 30], O: [0, 12] },
      charges: ["+2", 2, "2+"],
      tolerancePpm: "5",
      maxResults: 10,
      massIndex,
    };

    expect(findFormulaeForCharges(batch)).toEqual(single);
  });
});
