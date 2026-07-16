# `@formulam/mass-data`

Private workspace package containing FormulaM's exact-mass source data, schema types, and integrity validation.

## Source data

[`src/masses.json`](src/masses.json) is the single checked-in source consumed by the Web application. Its `_meta` object records the isotope-mass, default-isotope-selection, and radioactive-element references together with record counts and the package version for which it was assembled.

The current isotope masses originate from `periodictable 2.1.0` data derived from AME2020. Default selections cite NIST Physical Measurement Laboratory data and IUPAC/CIAAW Atomic Weights of the Elements 2023. The complete citations and source URLs remain embedded in the JSON metadata.

## Validation

From the repository root, run:

```bash
pnpm run validate:data
```

The default workspace `pnpm run check` and `pnpm run test` commands also type-check and validate this package.

## Updating the data

There is currently no in-repository generator for this dataset. Do not invent or imply a reproducible generator until the original upstream conversion process is available.

For an intentional data update:

1. Obtain and review the replacement data from the cited upstream sources and established external conversion process.
2. Replace only [`src/masses.json`](src/masses.json), preserving exact decimal strings and avoiding unrelated reformatting.
3. Update `_meta` sources, version information, and declared counts.
4. Run `pnpm run validate:data`, the full workspace test suite, and the production build.
5. Review the scientific diff, especially default isotopes, aliases, exact masses, and abundance changes.

This package is private and has no publication or release workflow.
