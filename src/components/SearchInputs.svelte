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

<section class="card search-card" aria-label="Search inputs">
  <h2>Search inputs</h2>
  <div class="input-grid">
    <label>
      <span>Observed m/z</span>
      <input
        type="text"
        inputmode="decimal"
        value={form.mz}
        disabled={disabled}
        on:input={(event) => onChange({ mz: (event.currentTarget as HTMLInputElement).value })}
      />
    </label>
    <label>
      <span>Explicit charge</span>
      <input
        type="text"
        value={form.charge}
        aria-describedby="chargeHelp"
        disabled={disabled}
        on:input={(event) => onChange({ charge: (event.currentTarget as HTMLInputElement).value })}
      />
      <small id="chargeHelp">Examples: +1, 1+, +2, 2+, -1, 2-</small>
    </label>
    <label>
      <span>Tolerance mode</span>
      <select
        value={form.toleranceMode}
        disabled={disabled}
        on:change={(event) => onChange({ toleranceMode: (event.currentTarget as HTMLSelectElement).value as SearchFormState["toleranceMode"] })}
      >
        <option value="ppm">ppm</option>
        <option value="Da">Da</option>
        <option value="both">both</option>
      </select>
    </label>
    <label>
      <span>Tolerance ppm <button class="help" type="button" aria-label="Tolerance ppm help" on:click={openPpmHelp}>?</button></span>
      <input
        type="text"
        inputmode="decimal"
        value={form.tolerancePpm}
        disabled={disabled || form.toleranceMode === "Da"}
        on:input={(event) => onChange({ tolerancePpm: (event.currentTarget as HTMLInputElement).value })}
      />
    </label>
    <label>
      <span>Tolerance Da</span>
      <input
        type="text"
        inputmode="decimal"
        placeholder="optional"
        value={form.toleranceDa}
        disabled={disabled || form.toleranceMode === "ppm"}
        on:input={(event) => onChange({ toleranceDa: (event.currentTarget as HTMLInputElement).value })}
      />
    </label>
    <label>
      <span>Max results</span>
      <input
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
  <dialog bind:this={ppmHelpDialog}>
    <form method="dialog">
      <h3>Tolerance ppm</h3>
      <p><code>ppm error = (predicted_mz - observed_mz) / observed_mz * 1,000,000</code></p>
      <p>A formula is accepted if the absolute ppm error is within the selected tolerance.</p>
      <button>Close</button>
    </form>
  </dialog>
</section>
