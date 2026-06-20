# AGENTS.md

## Scope

This file applies to the whole repository. Add subtree `AGENTS.md` files only when a rule is local to that subtree.

FormulaM is a static, browser-only molecular formula search tool for high-resolution mass spectrometry `m/z` values. Keep it compatible with the current GitHub Pages custom-domain deployment. Do not add a required server, database, hosted API, runtime secret, account-bound service, telemetry, or required network call for normal search/import/export behavior.

The current implementation is Vite + TypeScript + Svelte. Preserve existing scientific behavior unless explicitly asked to change it.

## Repository map

- `src/core/`: framework-independent scientific logic grouped by domain: `chemistry/` for mass data, formula formatting/display, formula TeX conversion, and decimal helpers; `dom/` for browser-safe DOM utilities; `math/` for shared TeX rendering helpers and math label constants; `search/` for search-space handling, charge input, search execution, form state, and result sorting; `spectrum/` for import, normalization, assignments, and peak selection; `plot/` for plot calculations and scene construction; `export/` for CSV/download/PNG/PDF export helpers.
- `src/components/`: Svelte rendering, input state, events, accessibility, user interaction, and component-local scoped structural styles grouped by feature: `layout/`, `ui/`, `search/`, `results/`, and `spectrum/`. Delegate scientific/data-transformation logic to `src/core/`.
- `src/workers/`: worker protocol and long-running search execution.
- `public/data/masses.json`: scientific input data for runtime loading and tests.
- `tests/`: Vitest regression coverage for search, charge input, formula display, KaTeX/mhchem DOM rendering, sorting, spectrum import/rendering, results tables, plot settings, inline math labels, and related UI/data flows.
- `uno.config.ts`: UnoCSS preset assembly, safelist, theme token mapping, and shortcuts wiring.
- `src/styles/uno-*.ts`: UnoCSS theme token aliases, shared interaction fragments, and semantic shortcut definitions.
- `src/styles/global.css`: design tokens, resets, and truly global element-level styles only.

## Commands

Use the package manager already present in the branch. Verified scripts for the current implementation:

```bash
npm install
npm run dev
npm test
npm run check
npm run build
```

Use `npm run preview` only to inspect the production build locally.

Before marking a change complete, run the narrowest relevant check first. Run the full relevant sequence when touching shared TypeScript, search logic, scientific data, spectrum import/export, worker behavior, deployment configuration, or UI behavior:

```bash
npm test
npm run check
npm run build
```

Do not invent missing scripts. If a document mentions a script absent from `package.json`, such as `npm run validate:data`, report the mismatch and either add the script intentionally or use existing checks.

## Architecture and scientific behavior

- Keep scientific calculations in `src/core/`; keep formula enumeration and mass/tolerance calculations out of Svelte components.
- Keep long-running searches on the Web Worker path; do not block the main UI thread with large enumeration work.
- Treat observed input mass as `m/z`, not neutral mass.
- Keep charge explicit. FormulaM applies bare-ion electron-mass correction for charged species; do not add adduct behavior unless explicitly requested.
- Preserve semantics for formula, mass, `m/z`, Da error, ppm error, charge state, sorting, filtering, CSV export, spectrum assignment, and plot annotation unless the task changes them.
- Preserve raw formula encoding, but render isotope-local bracket notation such as `[13C]` without the isotope brackets in visible formula displays. Show isotope mass numbers as left superscripts next to the element, keep ion wrapper brackets such as `[C6H12O6]+`, and follow the same visible convention in future KaTeX/mhchem rendering.
- Render ordinary DOM chemical formulae through KaTeX with mhchem TeX sources such as `\ce{...}`. Keep FormulaM internal formula strings unchanged, and convert to mhchem only at the display/copy layer.
- Make whole-expression click/keyboard selection the default at the shared KaTeX component layer. Opt out only when the formula is inside a non-selectable or conflicting interactive surface, such as a sort button or pointer-disabled tooltip.
- Let DOM KaTeX formulas expand their line boxes vertically instead of clipping or adding height-driven scrollbars. Use display math for standalone equations; reserve horizontal overflow handling for width constraints only.
- Keep spectrum plot labels and PNG/PDF export labels on the existing rich-text plot renderer rather than DOM KaTeX. Plot/export formula labels should continue to use the shared formula display token stream.
- Treat `public/data/masses.json` as scientific source data. Do not replace, regenerate, reformat, or normalize it unless explicitly asked.
- Keep deployment base intentional. FormulaM uses a custom domain, so Vite `base` should remain `/` unless the deployment target changes. Do not change it to `/FormulaM/` merely because the repository is hosted on GitHub Pages; use `/FormulaM/` only for project-site deployment without the custom domain.

## Testing expectations

Add or update focused regression tests when changing:

- charge parsing, normalization, editing, display, or positive/negative and multi-charge search behavior
- electron-mass correction, exact-mass calculation, ppm/Da tolerance handling, isotope labels, formula formatting, display markup, KaTeX/mhchem conversion, or math label rendering
- result sorting, filtering, table rendering, CSV output, error messages, mass-data loading, or data-shape assumptions
- spectrum import, sheet/column detection, peak normalization, assignment behavior, exports, plot rendering, worker protocol, cancellation, busy/loading state, or error propagation

Do not weaken assertions to make tests pass. When debugging or testing needs real data, use `tests\Kaempferol.csv`. When browser testing needs an imported spectrum/CSV fixture, prefer an existing fixture under `tests/` and state which fixture was used.

## Style and dependencies

- Use TypeScript for new application and core code.
- Keep Svelte components focused on rendering, input state, events, and accessibility.
- Put reusable parsing, validation, formatting, search, export, and normalization logic in `src/core/` with typed inputs and outputs.
- Prefer explicit error messages over silent fallback behavior for scientific inputs and data-loading failures.
- Follow nearby naming and formatting conventions before introducing new patterns.
- Keep UnoCSS for reusable shortcuts, layout utilities, theme tokens, and design-system rules. Component `<style>` blocks are allowed only for component-private structural CSS tightly coupled to that component's markup, such as pseudo-elements, scroll-state shells, browser-specific selectors, or complex selector relationships that are awkward to maintain as shortcuts. Do not use scoped styles as a replacement for reusable semantic component styling, and do not move such styling into `src/styles/global.css`.
- Keep `global.css` limited to design tokens, resets, and truly global element-level behavior.
- Keep dependencies small and browser-compatible. Explain any new runtime dependency, especially for parsing, export, or plotting behavior.
- Add dependencies with `npm install <package>` or `npm install --save-dev <package>` so `package-lock.json` stays synchronized.
- Do not manually edit dependency entries in `package.json` without updating the lockfile through the package manager.
- Do not commit secrets, tokens, credentials, private keys, or environment-specific service configuration.

## Maintaining these instructions

Update this file in the same change when modifying repository-wide assumptions future agents rely on, including architecture boundaries, package scripts, deployment base behavior, scientific search semantics, worker behavior, dependency policy, test expectations, or data-shape assumptions.

Do not leave stale instructions here. If a task makes an existing rule obsolete, revise or remove that rule as part of the same change.

## Completion notes

When reporting completion, include what changed and why, which tests/checks were run, any check that could not be run with the concrete reason, and any known mismatch between repository instructions and actual files.

Do not claim a behavior is verified unless the relevant command was actually run or the file was directly inspected.
