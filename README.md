<p align="center">
  <img src="public/logo.svg" alt="FormulaM" width="520">
</p>

<p align="center">
  <strong>FormulaM</strong><br>
  Molecular formula enumeration from observed mass-spectrometry <code>m/z</code> values.
</p>

---

## Overview

This package is a Vite + TypeScript + Svelte refactor of the front-end-only FormulaM app. It keeps the same simplified exact-mass search rule:

```text
candidate_mz = candidate_formula_mass / abs(charge)
```

The input mass is always observed `m/z`. Charge is required and explicit. The sign of the charge is used only for labels such as `+`, `-`, `2+`, and `2-`.

## Stack

- Vite
- TypeScript
- Svelte
- Web Worker for formula enumeration
- GitHub Pages static deployment

## Local development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run validate:data
npm test
npm run build
```

## Project layout

```text
index.html
vite.config.ts
package.json
public/
  logo.svg
  favicon.svg
  data/masses.json
src/
  App.svelte
  main.ts
  components/
  core/
  workers/
  styles/
scripts/
  check-masses.ts
tests/
  smoke.test.ts
.github/workflows/pages.yml
```

## Notes on mass data

The included `public/data/masses.json` is generated from RDKit 2025.09.4 in the same shape expected by FormulaM. The GitHub connector could identify the current repository blob SHA but could not inline the large `data/masses.json` contents into this environment. For strict continuity with the repository at a specific commit, replace `public/data/masses.json` with the current `data/masses.json` from `Lastoria-Royal-College-of-Science/FormulaM` before final publication. You can do that with:

```bash
npm run sync:masses -- /path/to/FormulaM/data/masses.json
```

## Scientific disclaimer

FormulaM enumerates candidate formulas from exact-mass constraints. A returned formula is not a confirmed molecular identity or structure. Confirm candidates with isotope-pattern agreement, MS/MS fragmentation, retention time, ionization behavior, sample context, and chemical plausibility.
