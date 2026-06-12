import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const payload = JSON.parse(await readFile(new URL("../public/data/masses.json", import.meta.url), "utf8"));

assert.equal(typeof payload, "object");
assert.equal(typeof payload.isotopes, "object");
assert.equal(typeof payload.default_isotope_by_symbol, "object");

for (const symbol of ["H", "C", "N", "O", "B", "Cl", "U"]) {
  assert.ok(payload.default_isotope_by_symbol[symbol], `missing default isotope for ${symbol}`);
}

for (const label of ["1H", "12C", "13C", "14N", "16O", "10B", "11B", "238U"]) {
  assert.ok(payload.isotopes[label], `missing isotope ${label}`);
  assert.ok(Number(payload.isotopes[label].exact_mass) > 0, `invalid mass for ${label}`);
}

console.log(
  `mass data ok: ${Object.keys(payload.default_isotope_by_symbol).length} element defaults, ${Object.keys(payload.isotopes).length} isotope records`,
);
