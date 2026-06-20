# Contributing to FormulaM

Thank you for your interest in contributing to FormulaM.

FormulaM is a static, browser-only molecular formula search tool for high-resolution mass spectrometry observed `m/z` values. Contributions are welcome, but changes should preserve the project's scientific behavior, front-end-only architecture, and GitHub Pages deployment model unless a change is explicitly proposed and reviewed.

## Ways to contribute

You can contribute by:

- Reporting reproducible bugs
- Reporting unexpected scientific or calculation results
- Suggesting focused feature improvements
- Improving documentation
- Adding or improving tests
- Improving UI, accessibility, or usability
- Reviewing issues and pull requests

For large changes, open an issue before implementation work begins. This is especially important for scientific behavior changes, adduct support, mass-data changes, worker behavior, deployment changes, dependency changes, or broad refactors.

## Project overview

FormulaM is built with:

- Vite
- TypeScript
- Svelte
- UnoCSS
- Vitest
- Playwright
- Web Workers for long-running formula enumeration
- GitHub Pages static deployment

FormulaM should remain front-end only. Do not add a required server, database, hosted API, runtime secret, account-bound service, telemetry, or required network call for normal search, import, or export behavior.

## Repository layout

Important paths:

- `public/data/masses.json` Scientific input data loaded at runtime and in tests
- `src/core/` Framework-independent scientific and data logic
- `src/components/` Svelte UI, input state, events, and accessibility
- `src/workers/` Worker protocol and long-running search execution
- `src/styles/global.css` Design tokens, resets, and truly global styles only
- `uno.config.ts` UnoCSS shortcuts, safelist, theme tokens, and utilities
- `tests/` Vitest coverage with root smoke tests, `core/`, `components/`, and `integration/`
- `e2e/` Playwright browser-flow tests with root smoke tests tagged `@smoke`
- `examples/` Shared example and test input files such as `examples/Kaempferol.csv`
- `.github/workflows/` CI and GitHub Pages deployment

Guidelines:

- Keep scientific calculations in `src/core/`.
- Keep formula enumeration and mass/tolerance calculations out of Svelte components.
- Keep Svelte components focused on rendering, input state, events, and accessibility.
- Keep long-running searches on the Web Worker path so large enumerations do not block the main UI thread.
- Keep `public/data/masses.json` as scientific source data. Do not replace, regenerate, reformat, or normalize it unless the change explicitly requires that.
- Keep global CSS limited to design tokens, resets, and truly global element-level behavior.
- Keep UnoCSS responsible for shortcuts, layout utilities, theme tokens, and design-system rules.

## Development setup

Use the package manager already present in the repository. The current project uses npm with `package-lock.json`.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build a production-ready static site:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Use `npm run preview` only after building, when you need to inspect production output locally.

## Available scripts

Current package scripts are:

```bash
npm run dev
npm run build
npm run preview
npm run check
npm test
npm run test:e2e
```

Do not rely on scripts that are not present in `package.json` in your branch. If documentation mentions a missing script, either update the documentation or add the script intentionally with the relevant implementation.

## Checks before submitting

Run the narrowest relevant check first while developing. Before opening a pull request that touches shared TypeScript, scientific logic, data loading, spectrum import/export, worker behavior, deployment configuration, or UI behavior, run the full relevant sequence:

```bash
npm test
npm run check
npm run build
npm run test:e2e
```

For documentation-only changes, explain in the pull request if code checks were not run.

Vitest uses two config projects: `smoke` runs `tests/smoke.test.ts` first, and `regression` runs all non-smoke Vitest files under `tests/` after smoke passes. If smoke is already failing and you need diagnostic access to the remaining Vitest suite, run:

```bash
npm test -- --project regression --bail=0
```

Playwright also uses `smoke` and `regression` config projects. Playwright smoke tests must include `@smoke` in the test title. Default `npm run test:e2e` runs `@smoke` tests first because `regression` depends on `smoke`. If Playwright smoke is already failing and you need diagnostic access to the remaining browser tests, run:

```bash
npm run test:e2e -- --project regression --no-deps
```

Use bypass commands only for diagnosis. The relevant default command, `npm test` or `npm run test:e2e`, remains the final validation command.

The test workflow currently installs dependencies with `npm ci`, runs `npm run check`, `npm test`, `npm run build`, installs Chromium for Playwright, and runs `npm run test:e2e`.

## Scientific behavior

FormulaM enumerates candidate molecular formulae from observed mass spectrometry `m/z` values. A returned formula is not a confirmed molecular identity or molecular structure.

Preserve these assumptions unless the issue or pull request explicitly changes them:

- User input mass is observed `m/z`, not neutral mass.
- Charge is required and explicit.
- FormulaM applies bare-ion electron-mass correction for charged species.
- FormulaM does not add adduct behavior by default.
- Preserve semantics for formula, mass, `m/z`, Da error, ppm error, charge state, sorting, filtering, CSV export, spectrum assignment, and plot annotation unless the task changes them.

When changing scientific behavior, explain:

- The existing behavior
- The proposed behavior
- The scientific rationale
- The affected inputs and outputs
- The tests added or updated

Changes to formula enumeration, electron-mass correction, exact-mass calculation, tolerance handling, isotope labels, charge parsing, sorting, filtering, assignment, or display should include focused regression tests.

## Testing expectations

Add or update focused regression tests when changing:

- Charge parsing, normalization, editing, display, or positive/negative and multi-charge search behavior
- Electron-mass correction
- Exact-mass calculation
- ppm or Da tolerance handling
- Isotope labels
- Formula formatting or display markup
- Result sorting, filtering, or table rendering
- CSV output
- Error messages
- Mass-data loading or data-shape assumptions
- Spectrum import
- Sheet or column detection
- Peak normalization
- Assignment behavior
- Export behavior
- Plot rendering
- Worker protocol, cancellation, busy/loading state, or error propagation

Do not weaken assertions just to make tests pass.

When debugging or testing needs real data, use `examples/Kaempferol.csv`. If a fixture is important to the change, state which fixture was used in the pull request.

Keep smoke tests at each runner root: Vitest smoke tests belong directly under `tests/`, and Playwright smoke tests belong directly under `e2e/` with `@smoke` in the test title. Configure smoke gatekeeping in the runner configuration files, not by splitting npm scripts into smoke and non-smoke phases. The Vitest config should keep the `smoke` project before the parallel `regression` project. The Playwright config should route `@smoke` tests to `smoke`, route non-smoke tests to `regression`, and keep `regression` dependent on `smoke`.

## UI and accessibility

When working on Svelte components:

- Keep components focused on rendering, input state, events, and accessibility.
- Move reusable data transformation, parsing, validation, formatting, search, export, and normalization logic into `src/core/`.
- Preserve keyboard and screen-reader behavior where applicable.
- Prefer explicit error messages over silent fallback behavior, especially for scientific inputs and data-loading failures.
- Follow nearby naming, structure, and formatting conventions before introducing new patterns.

## Dependencies

Keep dependencies small, browser-compatible, and justified.

Before adding a dependency, consider whether the behavior can be implemented clearly with existing project dependencies.

Add runtime dependencies with:

```bash
npm install <package>
```

Add development-only dependencies with:

```bash
npm install --save-dev <package>
```

Do not manually edit dependency entries in `package.json` without updating `package-lock.json` through npm.

In the pull request description, explain why any new runtime dependency is needed, especially for parsing, export, plotting, scientific computation, or data handling.

## Deployment

FormulaM is deployed as a static GitHub Pages site.

The Vite `base` is intentionally `/` for the current custom-domain deployment. Do not change it to `/FormulaM/` merely because the repository is hosted on GitHub Pages. Only change the base path when the deployment target changes and the pull request explains why.

## Branch and pull request workflow

1. Fork or branch from `main`.
2. Create a focused branch.
3. Make a small, reviewable change.
4. Add or update tests where appropriate.
5. Run the relevant checks.
6. Open a pull request against `main`.

Example branch names:

```text
fix/charge-parsing
docs/contributing-guide
test/spectrum-import
ui/results-table-accessibility
```

Keep pull requests focused. Avoid bundling unrelated refactors, dependency updates, UI changes, and scientific behavior changes into one PR.

## Commit messages

Use [coventional commit messages](https://www.conventionalcommits.org/) with a type, optional scope, and descriptive message.

Good examples:

```text
fix: preserve negative charge electron correction
test: add regression coverage for mixed isotope formulae
docs: add contribution guidelines
ui: improve results table accessibility
```

Avoid vague messages such as:

```text
fix stuff
update files
changes
```

## Pull request checklist

Before opening a pull request, confirm:

- [ ] The change has a clear purpose.
- [ ] The PR is focused and reviewable.
- [ ] Scientific behavior changes are explained.
- [ ] Tests were added or updated when behavior changed.
- [ ] `npm test` passes, when relevant.
- [ ] `npm run check` passes, when relevant.
- [ ] `npm run build` passes, when relevant.
- [ ] `npm run test:e2e` passes, when relevant.
- [ ] Documentation was updated if user-facing behavior changed.
- [ ] New dependencies are justified and browser-compatible.
- [ ] `package-lock.json` is updated when dependencies changed.
- [ ] No secrets, tokens, credentials, private keys, or environment-specific service configuration were committed.

## Reporting bugs

When reporting a bug, include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Input values, charge state, tolerance, and selected elements where relevant
- Browser and operating system
- Screenshots, console errors, or exported data when helpful

For scientific or mass-calculation issues, include enough detail for maintainers to reproduce the result exactly.

## Requesting features

For feature requests, explain:

- The problem you want to solve
- The workflow affected
- Why existing behavior is insufficient
- Expected input and output behavior
- Whether the change affects scientific assumptions
- Possible alternatives or compatibility concerns

Open an issue before implementing large features, adduct support, changes to mass-data handling, major UI redesigns, deployment changes, or dependency changes.

## Security

Do not open public issues for security vulnerabilities involving secrets, credentials, deployment configuration, or supply-chain risk.

If you find a security issue, contact the maintainers privately instead of publishing exploit details in an issue.

## License

By contributing, you agree that your contribution will be licensed under the project's MIT License.
