<script lang="ts">
  import { tokenizeFormulaDisplay } from "../../core/chemistry/formulaDisplay";

  export let formula: string;

  $: tokens = tokenizeFormulaDisplay(formula);
</script>

<span class="chemical-formula" aria-label={formula}>
  {#each tokens as token, index (index)}
    {#if token.kind === "sub"}
      <sub>{token.text}</sub>
    {:else if token.kind === "sup"}
      <sup>{token.text}</sup>
    {:else if token.kind === "isotope"}
      <span class="formula-isotope"><sup class="formula-isotope-mass">{token.massNumber}</sup><span class="formula-isotope-element">{token.element}</span></span>
    {:else}
      {token.text}
    {/if}
  {/each}
</span>

<style>
  .formula-isotope {
    display: inline-flex;
    align-items: baseline;
    margin-inline-start: 0.14em;
  }

  .formula-isotope-mass {
    margin-inline-end: 0.02em;
  }
</style>
