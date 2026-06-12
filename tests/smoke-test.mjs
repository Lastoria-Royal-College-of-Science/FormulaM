import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildMassIndex } from "../src/massData.js";
import { findFormulas } from "../src/search.js";

const payload = JSON.parse(await readFile(new URL("../data/masses.json", import.meta.url), "utf8"));
const massIndex = buildMassIndex(payload);

const glucose = findFormulas({
  mz: "180.063388104",
  elements: { C: [0, 12], H: [0, 30], O: [0, 12] },
  charge: "+1",
  tolerancePpm: "5",
  maxResults: 10,
  massIndex,
});
assert.ok(glucose.length > 0, "expected glucose-like hits");
assert.equal(glucose[0].formula, "C6H12O6");

const glucose2p = findFormulas({
  mz: "90.031694052",
  elements: { C: [0, 12], H: [0, 30], O: [0, 12] },
  charge: "+2",
  tolerancePpm: "5",
  maxResults: 10,
  massIndex,
});
assert.ok(glucose2p.length > 0, "expected 2+ glucose-like hits");
assert.equal(glucose2p[0].formula, "C6H12O6");
assert.equal(glucose2p[0].charge_state, "2+");

const mixedIsotope = findFormulas({
  mz: "181.066742940",
  elements: { C: [5, 5], "13C": [1, 1], H: [12, 12], O: [6, 6] },
  charge: "+1",
  toleranceDa: "0.000001",
  tolerancePpm: null,
  maxResults: 10,
  massIndex,
});
assert.ok(mixedIsotope.length > 0, "expected mixed isotope hit");
assert.equal(mixedIsotope[0].formula, "C5[13C]H12O6");

console.log("FormulaM smoke tests passed");
