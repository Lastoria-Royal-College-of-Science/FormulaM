<script lang="ts">
  import ToggleSwitch from "./ToggleSwitch.svelte";

  export let includeUnassigned = false;
  export let canExportAssignments = false;
  export let disabled = false;
  export let totalPeaks = 0;
  export let assignedCount = 0;
  export let onIncludeUnassignedChange: (value: boolean) => void;
  export let onExportAssignments: () => void;
  export let onExportPng: () => void;
  export let onExportPdf: () => void;
</script>

<section class="ui-card">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="mt-0">Export</h2>
      <p class="mb-0 mt-1 text-sm text-muted">Download a peak assignment table plus annotated PNG or PDF versions of the current spectrum view.</p>
    </div>
    <div class="rounded-2 border border-solid border-border bg-surface-2 px-3.5 py-2.5 text-sm text-muted">
      {assignedCount} assigned / {totalPeaks} total peaks
    </div>
  </div>

  <div class:toggle-control-disabled={disabled} class="toggle-control mt-4">
    <ToggleSwitch
      ariaLabel="Include unassigned peaks in assignment CSV"
      checked={includeUnassigned}
      disabled={disabled}
      onChange={onIncludeUnassignedChange}
    />
    <span class="toggle-copy text-muted">Include unassigned peaks in assignment CSV</span>
  </div>

  <div class="mt-4 flex flex-wrap gap-3">
    <button type="button" class="primary-action" disabled={disabled || !canExportAssignments} on:click={onExportAssignments}>Download assignments CSV</button>
    <button type="button" class="secondary-action" disabled={disabled || totalPeaks === 0} on:click={onExportPng}>Download annotated PNG</button>
    <button type="button" class="secondary-action" disabled={disabled || totalPeaks === 0} on:click={onExportPdf}>Download annotated PDF</button>
  </div>
</section>
