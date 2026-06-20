# FormulaM

Molecular formula enumeration from observed mass spectrometry $m/z$ values.

## Overview

This package is a Vite + TypeScript + Svelte refactor of the front-end-only FormulaM app. It applies a simplified bare-ion exact-mass rule:

```text
ion_mass = candidate_formula_mass - charge * electron_mass
candidate_mz = ion_mass / abs(charge)
```

The input mass is always observed $m/z$. Charge is required and explicit. FormulaM applies only the bare-ion electron-mass correction for charged species such as $\ce{[M]+}$, $\ce{[M]-}$, $\ce{[M]^2+}$, and $\ce{[M]^2-}$; it does not add adduct support.

## Local development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run check
npm run test
npm run build
npm run e2e
```

## Scientific disclaimer

FormulaM enumerates candidate formulae from exact-mass constraints. A returned formula is not a confirmed molecular identity or structure. Confirm candidates with isotope-pattern agreement, MS/MS fragmentation, retention time, ionization behavior, sample context, and chemical plausibility.
