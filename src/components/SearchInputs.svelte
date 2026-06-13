<script lang="ts">
  import type { SearchFormState } from "../core/types";

  export let form: SearchFormState;
  export let disabled = false;
  export let onChange: (patch: Partial<SearchFormState>) => void;

  let ppmHelpDialog: HTMLDialogElement;

  function openPpmHelp(): void {
    ppmHelpDialog?.showModal();
  }
</script>

<section class="ui-card" aria-label="Search inputs">
  <h2 class="mt-0">Search inputs</h2>
  <div class="grid grid-cols-3 gap-4 lt-md:grid-cols-1">
    <label class="block">
      <span class="field-title">Observed m/z</span>
      <input
        class="field-control"
        type="text"
        inputmode="decimal"
        value={form.mz}
        disabled={disabled}
        on:input={(event) => onChange({ mz: (event.currentTarget as HTMLInputElement).value })}
      />
    </label>
    <label class="block">
      <span class="field-title">Explicit charge</span>
      <input
        class="field-control"
        type="text"
        value={form.charge}
        aria-describedby="chargeHelp"
        disabled={disabled}
        on:input={(event) => onChange({ charge: (event.currentTarget as HTMLInputElement).value })}
      />
      <small id="chargeHelp" class="field-hint">Examples: +1, 1+, +2, 2+, -1, 2-</small>
    </label>
    <label class="block">
      <span class="field-title">Tolerance mode</span>
      <select
        class="field-control field-select"
        value={form.toleranceMode}
        disabled={disabled}
        on:change={(event) => onChange({ toleranceMode: (event.currentTarget as HTMLSelectElement).value as SearchFormState["toleranceMode"] })}
      >
        <option value="ppm">ppm</option>
        <option value="Da">Da</option>
        <option value="both">both</option>
      </select>
    </label>
    <div class="block">
      <div class="field-title flex items-center gap-1.25">
        <label for="tolerancePpm">Tolerance ppm</label>
        <button class="help-button" type="button" aria-label="Tolerance ppm help" on:click={openPpmHelp}>?</button>
      </div>
      <input
        id="tolerancePpm"
        class="field-control"
        type="text"
        inputmode="decimal"
        value={form.tolerancePpm}
        disabled={disabled || form.toleranceMode === "Da"}
        on:input={(event) => onChange({ tolerancePpm: (event.currentTarget as HTMLInputElement).value })}
      />
    </div>
    <label class="block">
      <span class="field-title">Tolerance Da</span>
      <input
        class="field-control"
        type="text"
        inputmode="decimal"
        placeholder="optional"
        value={form.toleranceDa}
        disabled={disabled || form.toleranceMode === "ppm"}
        on:input={(event) => onChange({ toleranceDa: (event.currentTarget as HTMLInputElement).value })}
      />
    </label>
    <label class="block">
      <span class="field-title">Max results</span>
      <input
        class="field-control"
        type="number"
        min="1"
        max="5000"
        step="10"
        value={form.maxResults}
        disabled={disabled}
        on:input={(event) => onChange({ maxResults: Number((event.currentTarget as HTMLInputElement).value) })}
      />
    </label>
  </div>
  <dialog class="max-w-[520px] rounded-2 border border-solid border-border bg-surface p-4 text-text shadow-app" bind:this={ppmHelpDialog}>
    <form method="dialog" class="m-0">
      <h3 class="mt-0">Tolerance ppm</h3>
      <p><code class="inline-code">ppm error = (predicted_mz - observed_mz) / observed_mz * 1,000,000</code></p>
      <p>A formula is accepted if the absolute ppm error is within the selected tolerance.</p>
      <button class="secondary-action">Close</button>
    </form>
  </dialog>
</section>
