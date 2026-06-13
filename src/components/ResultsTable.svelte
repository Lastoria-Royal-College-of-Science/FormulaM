<script lang="ts">
  import type { FormulaHit } from "../core/types";

  export let results: FormulaHit[] = [];
  export let selectedPeakLabel = "";
  export let selectedPeakHasAssignment = false;
  export let onAssign: ((hit: FormulaHit) => void) | null = null;
</script>

<section class="ui-card">
  <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="mt-0">Candidate formulas</h2>
      {#if onAssign}
        <p class="mb-0 mt-1 text-sm text-muted">
          {#if selectedPeakLabel}
            Assigning against selected peak {selectedPeakLabel}.
          {:else}
            Select a peak in the spectrum plot to enable assignment.
          {/if}
        </p>
      {/if}
    </div>
  </div>
  <div class="w-full overflow-x-auto">
    <table class="w-full border-collapse whitespace-nowrap tabular-nums">
      <thead>
        <tr>
          <th class="table-head">formula</th>
          <th class="table-head">ion_formula</th>
          <th class="table-head">charge</th>
          <th class="table-head">neutral_mass</th>
          <th class="table-head">predicted_mz</th>
          <th class="table-head">error_da</th>
          <th class="table-head">error_ppm</th>
          {#if onAssign}
            <th class="table-head">assign</th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each results as hit}
          <tr class="odd:bg-row">
            <td class="table-cell">{hit.formula}</td>
            <td class="table-cell">{hit.ion_formula}</td>
            <td class="table-cell">{hit.charge_state}</td>
            <td class="table-cell">{hit.mass}</td>
            <td class="table-cell">{hit.mz}</td>
            <td class="table-cell">{hit.error_da}</td>
            <td class="table-cell">{hit.error_ppm}</td>
            {#if onAssign}
              <td class="table-cell">
                <button type="button" class="secondary-action px-3 py-1.75 text-sm" disabled={!selectedPeakLabel} on:click={() => onAssign?.(hit)}>
                  {selectedPeakHasAssignment ? "Replace" : "Assign"}
                </button>
              </td>
            {/if}
          </tr>
        {:else}
          <tr>
            <td colspan={onAssign ? 8 : 7} class="table-cell px-2 py-4.5 text-center text-muted">No candidate formulas matched the current search.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
