<script lang="ts">
  import type { FormulaHit } from "../core/types";

  export let results: FormulaHit[] = [];
</script>

<section class="card results-card">
  <h2>Candidate formulas</h2>
  <div class="results-wrap">
    <table class="results-table">
      <thead>
        <tr>
          <th>formula</th>
          <th>ion_formula</th>
          <th>charge</th>
          <th>neutral_mass</th>
          <th>predicted_mz</th>
          <th>error_da</th>
          <th>error_ppm</th>
        </tr>
      </thead>
      <tbody>
        {#each results as hit}
          <tr>
            <td>{hit.formula}</td>
            <td>{hit.ion_formula}</td>
            <td>{hit.charge_state}</td>
            <td>{hit.mass}</td>
            <td>{hit.mz}</td>
            <td>{hit.error_da}</td>
            <td>{hit.error_ppm}</td>
          </tr>
        {:else}
          <tr>
            <td colspan="7" class="empty-results">No candidate formulas matched the current search.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
