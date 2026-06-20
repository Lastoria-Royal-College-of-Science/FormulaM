<script lang="ts">
  import { selectElementContents } from "../../core/dom/selection";
  import { tokenizeFormulaDisplay } from "../../core/chemistry/formulaDisplay";
  import { tryFormulaToMhchemTex } from "../../core/chemistry/formulaTex";
  import MathTex from "./MathTex.svelte";

  export let formula: string;

  let fallbackRoot: HTMLSpanElement;

  $: tex = tryFormulaToMhchemTex(formula);
  $: tokens = tokenizeFormulaDisplay(formula);

  function selectFallbackFormula(): void {
    if (!fallbackRoot) return;
    selectElementContents(fallbackRoot);
  }

  function handleFallbackKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectFallbackFormula();
  }
</script>

{#if tex}
  <MathTex className="chemical-formula" {tex} ariaLabel={formula} fallback={formula} />
{:else}
  <span
    bind:this={fallbackRoot}
    class="chemical-formula chemical-formula-selectable"
    aria-label={formula}
    role="button"
    data-selectable-formula="true"
    tabindex="0"
    title="Click to select formula"
    on:click={selectFallbackFormula}
    on:keydown={handleFallbackKeydown}
  >
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
{/if}

<style>
  .formula-isotope {
    display: inline-flex;
    align-items: baseline;
    margin-inline-start: 0.14em;
  }

  .chemical-formula-selectable {
    cursor: copy;
    user-select: text;
  }

  .chemical-formula-selectable:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }

  sub + .formula-isotope {
    margin-inline-start: 0;
  }

  .formula-isotope-mass {
    margin-inline-end: 0.02em;
  }
</style>
