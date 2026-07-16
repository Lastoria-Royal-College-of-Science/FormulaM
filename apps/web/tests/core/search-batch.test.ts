import { describe, expect, it } from "vitest";

import { buildMassIndex } from "../../src/core/chemistry/massData";
import { findFormulae, findFormulaeForCharges } from "../../src/core/search/search";
import type { FormulaSearchRequest } from "../../src/core/types";
import { massPayload } from "../helpers/massData";

const massIndex = buildMassIndex(massPayload);

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
