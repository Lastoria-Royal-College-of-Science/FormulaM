<script lang="ts">
  import type { PeakAssignment, SpectrumPeak } from "../core/types";

  export let selectedPeak: SpectrumPeak | null = null;
  export let assignment: PeakAssignment | null = null;
  export let onRemoveAssignment: (peakId: string) => void;
</script>

<section class="ui-card">
  <h2 class="mt-0">Peak inspector</h2>

  {#if selectedPeak}
    <div class="grid grid-cols-2 gap-4 lt-md:grid-cols-1">
      <div class="rounded-2 border border-solid border-border bg-surface-2 px-3.5 py-3">
        <div class="text-xs uppercase tracking-[0.14em] text-muted">Selected peak</div>
        <div class="mt-2 text-sm"><strong class="text-text">Observed <code class="inline-code">m/z</code>:</strong> {selectedPeak.mz.toFixed(6)}</div>
        <div class="mt-1 text-sm"><strong class="text-text">Intensity:</strong> {selectedPeak.intensity}</div>
        <div class="mt-1 text-sm"><strong class="text-text">Relative intensity:</strong> {selectedPeak.relativeIntensity.toFixed(2)}%</div>
      </div>

      <div class="rounded-2 border border-solid border-border bg-surface-2 px-3.5 py-3">
        <div class="text-xs uppercase tracking-[0.14em] text-muted">Assignment</div>
        {#if assignment}
          <div class="mt-2 text-sm"><strong class="text-text">Formula:</strong> {assignment.formula}</div>
          <div class="mt-1 text-sm"><strong class="text-text">Ion formula:</strong> {assignment.ionFormula ?? "n/a"}</div>
          <div class="mt-1 text-sm"><strong class="text-text">Predicted <code class="inline-code">m/z</code>:</strong> {assignment.predictedMz?.toFixed(6) ?? "n/a"}</div>
          <div class="mt-1 text-sm"><strong class="text-text">Error:</strong> {assignment.errorPpm?.toFixed(4) ?? "n/a"} ppm</div>
          <button class="secondary-action mt-3" type="button" on:click={() => onRemoveAssignment(selectedPeak.id)}>Remove assignment</button>
        {:else}
          <p class="mb-0 mt-2 text-sm text-muted">No formula assigned yet. Select a candidate hit below and click Assign.</p>
        {/if}
      </div>
    </div>
  {:else}
    <p class="mb-0 text-sm text-muted">Click a peak in the spectrum plot to populate FormulaM <code class="inline-code">m/z</code> and prepare a formula assignment.</p>
  {/if}
</section>
