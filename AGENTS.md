# AGENTS.md

## Scope

This file applies to the whole repository. Add subtree `AGENTS.md` files only when a rule is local to that subtree.

FormulaM is a static, browser-only molecular formula search tool for high-resolution mass spectrometry `m/z` values. Keep it compatible with the current GitHub Pages custom-domain deployment. Do not add a required server, database, hosted API, runtime secret, account-bound service, telemetry, or required network call for normal search/import/export behavior.

The current implementation is Vite + TypeScript + Svelte. Preserve existing scientific behavior unless explicitly asked to change it.

## Repository map

- `apps/web/`: the private `@formulam/web` Vite + Svelte application package and its package-local configuration.
- `apps/web/src/core/`: framework-independent scientific logic grouped by domain: `chemistry/` for mass data, formula formatting/display, formula TeX conversion, and decimal helpers; `dom/` for browser-safe DOM utilities; `math/` for shared TeX rendering helpers and math label constants; `search/` for search-space handling, charge input, search execution, form state, and result sorting; `spectrum/` for import, normalization, assignments, and peak selection; `plot/` for plot calculations and scene construction; `export/` for CSV/download/PNG/PDF export helpers.
- `apps/web/src/components/`: Svelte rendering, input state, events, accessibility, user interaction, and component-local scoped structural styles grouped by feature: `layout/`, `ui/`, `search/`, `results/`, and `spectrum/`. Delegate scientific/data-transformation logic to `apps/web/src/core/`.
- `apps/web/src/workers/`: worker protocol and long-running search execution.
- `packages/mass-data/`: the private `@formulam/mass-data` package, including the single scientific source file, schema types, integrity validator, and data-level tests.
- `packages/mass-data/src/masses.json`: scientific input data consumed by the Web app as a hashed static resource.
- `apps/web/tests/`: Vitest regression coverage organized into root smoke tests, `core/` for framework-independent logic, `components/` for Svelte SSR/component output tests, and `integration/` for cross-layer Vitest checks.
- `apps/web/e2e/`: Playwright browser-flow tests. Keep Playwright smoke tests at the package-local `e2e/` root and tag them with `@smoke` so the Playwright config can run them as the gatekeeper project before dependent browser tests.
- `examples/`: Shared example and test input files such as `examples/Kaempferol.csv`.
- `apps/web/uno.config.ts`: UnoCSS preset assembly, safelist, theme token mapping, and shortcuts wiring.
- `apps/web/src/styles/uno-*.ts`: UnoCSS theme token aliases, shared interaction fragments, and semantic shortcut definitions.
- `apps/web/src/styles/global.css`: design tokens, resets, and truly global element-level styles only.
- `package.json`: workspace orchestration scripts and repository-wide Oxc tooling only.
- `pnpm-workspace.yaml`: workspace package discovery and cycle policy.

## Commands

Use the package manager already present in the branch. See the root `package.json` for workspace scripts and package-local manifests for owned dependencies. Use `pnpm install` locally, or `pnpm ci` when a clean installation from `pnpm-lock.yaml` is required. Use `pnpm run preview` only to inspect the production build locally. Do not use `pnpm run lint:fix` to auto-fix; it may break formatting rules.

Before marking a change complete, run the narrowest relevant check first. When touching shared TypeScript, search logic, scientific data, spectrum import/export, worker behavior, deployment configuration, or UI behavior, follow the full automated check order in `.github/workflows/test.yml`.

The Web package Vitest configuration uses two projects: `smoke` for `apps/web/tests/smoke.test.ts` and `regression` for all non-smoke files under `apps/web/tests/`. Default `pnpm run test` runs package tests recursively; within the Web package, smoke runs first and stops before regression tests if it fails. When Web smoke is already failing and you need diagnostic access to the remaining Vitest suite, run:

```bash
pnpm --filter @formulam/web run test --project regression --bail=0
```

Playwright also uses `smoke` and `regression` config projects. Playwright smoke tests must include `@smoke` in the test title. Default `pnpm run e2e` runs `@smoke` tests first because `regression` depends on `smoke`. When Playwright smoke is already failing and you need diagnostic access to the remaining browser tests, run:

```bash
pnpm --filter @formulam/web run e2e --project regression --no-deps
```

Use bypass commands only for diagnosis. Run the relevant default command, `pnpm run test` or `pnpm run e2e`, before marking the change complete.

Use `pnpm run validate:data` for the focused mass-data integrity suite. Do not invent other missing scripts; if a document mentions one that is absent from `package.json`, report the mismatch and either add it intentionally or use existing checks.

## Architecture and scientific behavior

- Keep Web scientific calculations in `apps/web/src/core/`; keep formula enumeration and mass/tolerance calculations out of Svelte components.
- Keep long-running searches on the Web Worker path; do not block the main UI thread with large enumeration work.
- Treat observed input mass as `m/z`, not neutral mass.
- Keep charge explicit. FormulaM applies bare-ion electron-mass correction for charged species; do not add adduct behavior unless explicitly requested.
- Preserve semantics for formula, mass, `m/z`, Da error, ppm error, charge state, sorting, filtering, CSV export, spectrum assignment, and plot annotation unless the task changes them.
- Preserve raw formula encoding, but render isotope-local bracket notation such as `[13C]` without the isotope brackets in visible formula displays. Show isotope mass numbers as left superscripts next to the element, keep ion wrapper brackets such as `[C6H12O6]+`, and follow the same visible convention in future KaTeX/mhchem rendering.
- Render ordinary DOM chemical formulae through KaTeX with mhchem TeX sources such as `\ce{...}`. Keep FormulaM internal formula strings unchanged, and convert to mhchem only at the display/copy layer.
- Make whole-expression click/keyboard selection the default at the shared KaTeX component layer. Opt out only when the formula is inside a non-selectable or conflicting interactive surface, such as a sort button or pointer-disabled tooltip.
- Let DOM KaTeX formulas expand their line boxes vertically instead of clipping or adding height-driven scrollbars. Use display math for standalone equations; reserve horizontal overflow handling for width constraints only.
- Keep spectrum plot labels and PNG/PDF export labels on the existing rich-text plot renderer rather than DOM KaTeX. Plot/export formula labels should continue to use the shared formula display token stream.
- Treat `packages/mass-data/src/masses.json` as the single scientific source data file. Do not replace, regenerate, reformat, or normalize it unless explicitly asked.
- Keep mass-data schema types and integrity validation in `packages/mass-data/`. The Web app should consume its JSON through the package export as a hashed Vite asset and must not maintain a second checked-in copy.
- Keep deployment base intentional. FormulaM uses a custom domain, so Vite `base` should remain `/` unless the deployment target changes. Do not change it to `/FormulaM/` merely because the repository is hosted on GitHub Pages; use `/FormulaM/` only for project-site deployment without the custom domain.

## Testing expectations

Add or update focused regression tests when changing:

- charge parsing, normalization, editing, display, or positive/negative and multi-charge search behavior
- electron-mass correction, exact-mass calculation, ppm/Da tolerance handling, isotope labels, formula formatting, display markup, KaTeX/mhchem conversion, or math label rendering
- result sorting, filtering, table rendering, CSV output, error messages, mass-data loading, or data-shape assumptions
- spectrum import, sheet/column detection, peak normalization, assignment behavior, exports, plot rendering, worker protocol, cancellation, busy/loading state, or error propagation
- mass-data schema, metadata counts, isotope/default/alias references, source metadata, or Web asset loading

Do not weaken assertions to make tests pass. When debugging or testing needs real data, use `examples/Kaempferol.csv`. When browser testing needs an imported spectrum/CSV fixture, prefer an existing fixture under `examples/` and state which fixture was used.

Keep smoke tests at each Web runner root: Vitest smoke tests belong directly under `apps/web/tests/`, and Playwright smoke tests belong directly under `apps/web/e2e/` with `@smoke` in the test title. Configure smoke gatekeeping in the runner configuration files, not by splitting package scripts into smoke and non-smoke phases. The Vitest config should keep the `smoke` project at `sequence.groupOrder: 0` and the parallel `regression` project at `sequence.groupOrder: 1`. The Playwright config should keep the `regression` project dependent on `smoke`, with `smoke` using `grep: /@smoke/` and `regression` using `grepInvert: /@smoke/`.

## Style and dependencies

- Use TypeScript for new application and core code.
- Keep Svelte components focused on rendering, input state, events, and accessibility.
- Put reusable Web parsing, validation, formatting, search, export, and normalization logic in `apps/web/src/core/` with typed inputs and outputs.
- Prefer explicit error messages over silent fallback behavior for scientific inputs and data-loading failures.
- Follow nearby naming and formatting conventions before introducing new patterns.
- Use forward slashes as path separators in code, documentation, comments, Markdown, and test strings. Use backslashes only in scripts or snippets explicitly intended for Windows command-line behavior.
- In top-level Markdown documents intended for human readers, such as `README.md` and `CONTRIBUTING.md`, format repository-relative file and directory references as relative Markdown links whose visible text is the path in inline code. AI-only Markdown documents, including `AGENTS.md` files, should keep repository-relative paths as inline code without Markdown links.
- Keep UnoCSS for reusable shortcuts, layout utilities, theme tokens, and design-system rules. Component `<style>` blocks are allowed only for component-private structural CSS tightly coupled to that component's markup, such as pseudo-elements, scroll-state shells, browser-specific selectors, or complex selector relationships that are awkward to maintain as shortcuts. Do not use scoped styles as a replacement for reusable semantic component styling, and do not move such styling into `apps/web/src/styles/global.css`.
- Keep `apps/web/src/styles/global.css` limited to design tokens, resets, and truly global element-level behavior.
- Keep dependencies small and browser-compatible. Explain any new runtime dependency, especially for parsing, export, or plotting behavior.
- Add Web dependencies with `pnpm --filter @formulam/web add <package>` or `pnpm --filter @formulam/web add -D <package>` so ownership is explicit and `pnpm-lock.yaml` stays synchronized.
- Add mass-data development dependencies with `pnpm --filter @formulam/mass-data add -D <package>`; the data package must not depend on the Web package.
- Keep the root package limited to workspace orchestration and repository-wide tooling. Do not add application runtime dependencies at the workspace root.
- Declare internal package dependencies with `workspace:*` and keep dependency direction acyclic.
- Do not manually edit dependency entries in `package.json` without updating the lockfile through the package manager.
- Do not commit secrets, tokens, credentials, private keys, or environment-specific service configuration.

## Maintaining these instructions

Update this file in the same change when modifying repository-wide assumptions future agents rely on, including architecture boundaries, package scripts, deployment base behavior, scientific search semantics, worker behavior, dependency policy, test expectations, or data-shape assumptions.

Do not leave stale instructions here. If a task makes an existing rule obsolete, revise or remove that rule as part of the same change.

## Completion notes

When reporting completion, include what changed and why, which tests/checks were run, any check that could not be run with the concrete reason, and any known mismatch between repository instructions and actual files.

Do not claim a behavior is verified unless the relevant command was actually run or the file was directly inspected.
