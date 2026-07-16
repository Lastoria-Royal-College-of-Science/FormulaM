# FormulaM

Molecular formula enumeration from observed mass spectrometry $m/z$ values.

## Overview

This pnpm workspace contains the Vite + TypeScript + Svelte front-end-only FormulaM app in [`apps/web/`](apps/web/) and its validated scientific source data in [`packages/mass-data/`](packages/mass-data/). The app applies a simplified bare-ion exact-mass rule:

```text
ion_mass = candidate_formula_mass - charge * electron_mass
candidate_mz = ion_mass / abs(charge)
```

The input mass is always observed $m/z$. Charge is required and explicit. FormulaM applies only the bare-ion electron-mass correction for charged species such as $\ce{[M]+}$, $\ce{[M]-}$, $\ce{[M]^2+}$, and $\ce{[M]^2-}$; it does not add adduct support.

## Local development

Workspace scripts are defined in [`package.json`](package.json), and the Web package scripts and dependencies are defined in [`apps/web/package.json`](apps/web/package.json).

```bash
pnpm install
pnpm run dev
```

The production build is written to [`apps/web/dist/`](apps/web/dist/).

## Checks

The full automated check order is defined in [`.github/workflows/test.yml`](.github/workflows/test.yml).

Run `pnpm run validate:data` for the focused mass-data integrity suite.

## Scientific disclaimer

FormulaM enumerates candidate formulae from exact-mass constraints. A returned formula is not a confirmed molecular identity or structure. Confirm candidates with isotope-pattern agreement, MS/MS fragmentation, retention time, ionization behavior, sample context, and chemical plausibility.
