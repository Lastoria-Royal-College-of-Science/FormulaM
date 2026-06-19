<script context="module" lang="ts">
  export function shouldIgnoreFilePickerCancel(file: File | null): boolean {
    return file === null;
  }
</script>

<script lang="ts">
  import MathTex from "../ui/MathTex.svelte";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";
  import { MZ_TEX } from "../../core/math/tex";
  import type { SpectrumImportSource, SpectrumPreviewTable } from "../../core/types";

  export let activeSheetName = "";
  export let disabled = false;
  export let hasHeaderRow = true;
  export let importError = "";
  export let importSource: SpectrumImportSource | null = null;
  export let intensityColumnIndex: number | null = null;
  export let intensityColumnName = "";
  export let mzColumnIndex: number | null = null;
  export let mzColumnName = "";
  export let onApplySelection: () => void;
  export let onImportFile: (file: File | null) => void;
  export let onSelectHasHeaderRow: (value: boolean) => void;
  export let onSelectIntensityColumn: (index: number | null) => void;
  export let onSelectMzColumn: (index: number | null) => void;
  export let onSelectSheet: (sheetName: string) => void;
  export let peakCount = 0;
  export let previewTable: SpectrumPreviewTable | null = null;
  export let sourceName = "";

  let fileInput: HTMLInputElement;

  $: activeSheet = importSource?.sheets.find((sheet) => sheet.name === activeSheetName) ?? importSource?.sheets[0] ?? null;
  $: columnOptions = previewTable?.columnLabels.map((label, index) => ({
    index,
    label: label || String(index + 1),
  })) ?? [];

  function handleFileChange(event: Event): void {
    const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
    if (shouldIgnoreFilePickerCancel(file)) return;
    onImportFile(file);
  }

  function clearSelection(): void {
    if (fileInput) fileInput.value = "";
    onImportFile(null);
  }

  function parseSelectedIndex(value: string): number | null {
    if (value === "") return null;
    const index = Number(value);
    return Number.isInteger(index) ? index : null;
  }
</script>

<section class="ui-card">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="mt-0">Spectrum import</h2>
      <p class="mb-0 mt-1 text-sm text-muted">Load local <code class="inline-code">.csv</code>, <code class="inline-code">.xlsx</code>, or <code class="inline-code">.xls</code> peak lists, preview the table, then choose the worksheet and columns to import.</p>
    </div>
    <button type="button" class="secondary-action" disabled={disabled || (!importSource && peakCount === 0)} on:click={clearSelection}>Clear spectrum</button>
  </div>

  <div class="mt-4 block">
    <span class="field-title">Peak list file</span>
    <input
      bind:this={fileInput}
      class="field-control-file"
      type="file"
      accept=".csv,.xlsx,.xls"
      aria-label="Peak list file"
      disabled={disabled}
      on:change={handleFileChange}
    />
  </div>

  {#if sourceName}
    <div class="mt-3 rounded-2 border border-solid border-border bg-surface-2 px-3.5 py-3 text-sm text-muted">
      <div><strong class="text-text">Loaded file:</strong> {sourceName}</div>
      <div><strong class="text-text">Imported peaks:</strong> {peakCount}</div>
      <div><strong class="text-text">Current columns:</strong> {mzColumnName || "not imported"} / {intensityColumnName || "not imported"}</div>
    </div>
  {:else}
    <p class="mb-0 mt-3 text-sm text-muted">No spectrum loaded. The original single <MathTex tex={MZ_TEX} ariaLabel="m/z" fallback="m/z" /> workflow still works without importing a file.</p>
  {/if}

  {#if importSource && activeSheet && previewTable}
    <div class="mt-4 grid grid-cols-4 gap-4 lt-lg:grid-cols-2 lt-md:grid-cols-1">
      {#if importSource.sheets.length > 1}
        <div class="block">
          <span class="field-title">Worksheet</span>
          <select class="field-control field-select" value={activeSheetName} aria-label="Worksheet" disabled={disabled} on:change={(event) => onSelectSheet((event.currentTarget as HTMLSelectElement).value)}>
            {#each importSource.sheets as sheet}
              <option value={sheet.name}>{sheet.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div class:toggle-control-disabled={disabled} class="toggle-control pt-7">
        <ToggleSwitch
          ariaLabel="First non-empty row is a header"
          checked={hasHeaderRow}
          disabled={disabled}
          onChange={onSelectHasHeaderRow}
        />
        <span class="toggle-copy">First non-empty row is a header</span>
      </div>

      <div class="block">
        <span class="field-title"><MathTex tex={MZ_TEX} ariaLabel="m/z" fallback="m/z" /> column</span>
        <select
          class="field-control field-select"
          value={mzColumnIndex ?? ""}
          aria-label="m/z column"
          disabled={disabled || columnOptions.length === 0}
          on:change={(event) => onSelectMzColumn(parseSelectedIndex((event.currentTarget as HTMLSelectElement).value))}
        >
          <option value="">Select column</option>
          {#each columnOptions as option}
            <option value={option.index}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="block">
        <span class="field-title">Intensity column</span>
        <select
          class="field-control field-select"
          value={intensityColumnIndex ?? ""}
          aria-label="Intensity column"
          disabled={disabled || columnOptions.length === 0}
          on:change={(event) => onSelectIntensityColumn(parseSelectedIndex((event.currentTarget as HTMLSelectElement).value))}
        >
          <option value="">Select column</option>
          {#each columnOptions as option}
            <option value={option.index}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="primary-action"
        disabled={disabled || mzColumnIndex === null || intensityColumnIndex === null}
        on:click={() => onApplySelection()}
      >
        Import selected sheet/columns
      </button>
      <p class="m-0 text-sm text-muted">
        Previewing {previewTable.rows.length} of {previewTable.totalRows} row(s) from
        <strong class="text-text">{activeSheet.name}</strong>.
      </p>
    </div>

    <div class="mt-4 overflow-x-auto rounded-2 border border-solid border-border">
      <table class="w-full border-collapse whitespace-nowrap text-sm">
        <thead class="bg-surface-2">
          <tr>
            {#each previewTable.columnLabels as label}
              <th class="table-head">{label}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each previewTable.rows as row}
            <tr class="odd:bg-row">
              {#each row as cell}
                <td class="table-cell">{cell || " "}</td>
              {/each}
            </tr>
          {:else}
            <tr>
              <td colspan={Math.max(1, previewTable.columnLabels.length)} class="table-cell px-2 py-4.5 text-center text-muted">No data rows are available in the current preview.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if importError}
    <p class="mb-0 mt-3 text-sm text-danger">{importError}</p>
  {/if}
</section>
