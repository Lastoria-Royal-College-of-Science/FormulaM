<script lang="ts">
  import { tokenizeFormulaDisplay } from "../core/formulaDisplay";

  export let formula: string;

  $: tokens = tokenizeFormulaDisplay(formula);
</script>

<span class="chemical-formula" aria-label={formula}>
  {#each tokens as token, index (index)}
    {#if token.kind === "sub"}
      <sub>{token.text}</sub>
    {:else if token.kind === "sup"}
      <sup>{token.text}</sup>
    {:else}
      {token.text}
    {/if}
  {/each}
</span>
