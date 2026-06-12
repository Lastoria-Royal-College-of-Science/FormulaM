<p align="center">
  <img src="logo.svg" alt="FormulaM" width="520">
</p>

<p align="center">
  <strong>FormulaM</strong><br>
  Molecular formula enumeration from observed mass-spectrometry <code>m/z</code> values.
</p>

---

## Core behavior

FormulaM keeps the same simplified formula-search behavior as the current Python/Streamlit FormulaM project:

```text
candidate_mz = candidate_formula_mass / abs(charge)
```

The input mass is always observed `m/z`. Charge is required and explicit. The sign of the charge is used only for labels such as `+`, `-`, `2+`, and `2-`.

## Main features

- Static HTML/CSS/JavaScript app.
- Runs on GitHub Pages.
- Observed `m/z` search.
- Explicit positive or negative charge.
- ppm, Da, or combined tolerance.
- Isotope-aware formula search rows.
- Repeated element rows with different isotopes, such as `12C` and `13C`.
- CSV export.
- Unified mass-data file at `data/masses.json`.

## Repository layout

```text
index.html                  Web app entry point
logo.svg                    Page logo
favicon.svg                 Browser favicon
.nojekyll                   Disable Jekyll processing on GitHub Pages
package.json                Local scripts

src/
  ui.js                     DOM/UI logic
  search.js                 Formula enumeration algorithm
  massData.js               Mass-data loading/indexing
  formula.js                Formula labels, isotope labels, charge labels
  decimal.js                BigInt decimal/rational helpers
  styles.css                Page styling

data/
  masses.json               Unified isotope/element mass table

scripts/
  check-masses.mjs          Mass-data validation script

tests/
  smoke-test.mjs            Basic search regression test

.github/workflows/
  pages.yml                 Optional GitHub Pages deployment workflow
```

## Scientific disclaimer

FormulaM enumerates candidate formulas from exact-mass constraints. A returned formula is not a confirmed molecular identity or structure. Confirm candidates with isotope-pattern agreement, MS/MS fragmentation, retention time, ionization behavior, sample context, and chemical plausibility.
