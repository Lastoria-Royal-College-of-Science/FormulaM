<script lang="ts">
  import { renderTexToHtml } from "../../core/math/tex";

  export let tex: string;
  export let displayMode = false;
  export let ariaLabel: string | undefined = undefined;
  export let fallback: string | undefined = undefined;
  export let className = "";

  $: rendered = renderTex(tex, displayMode);

  function renderTex(value: string, isDisplayMode: boolean): string {
    try {
      return renderTexToHtml(value, isDisplayMode);
    } catch {
      return "";
    }
  }
</script>

<span class={`math-tex ${className}`.trim()} aria-label={ariaLabel}>
  {#if rendered}
    {@html rendered}
  {:else}
    {fallback ?? tex}
  {/if}
</span>

<style>
  .math-tex {
    display: inline-flex;
    align-items: baseline;
    max-width: 100%;
    vertical-align: baseline;
  }

  .math-tex :global(.katex) {
    font-size: 1em;
    line-height: 1;
  }
</style>
