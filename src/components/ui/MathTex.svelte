<script lang="ts">
  import { selectElementContents } from "../../core/dom/selection";
  import { renderTexToHtml } from "../../core/math/tex";

  export let tex: string;
  export let displayMode = false;
  export let ariaLabel: string | undefined = undefined;
  export let fallback: string | undefined = undefined;
  export let className = "";
  export let selectable = true;
  export let selectionLabel = "Click to select formula";

  let root: HTMLSpanElement;

  $: rendered = renderTex(tex, displayMode);

  function renderTex(value: string, isDisplayMode: boolean): string {
    try {
      return renderTexToHtml(value, isDisplayMode);
    } catch {
      return "";
    }
  }

  function selectSelf(): void {
    if (!selectable || !root) return;
    selectElementContents(root);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!selectable) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectSelf();
  }
</script>

{#if selectable}
  <span
    bind:this={root}
    class={`math-tex math-tex-selectable ${className}`.trim()}
    aria-label={ariaLabel}
    role="button"
    data-selectable-formula="true"
    tabindex="0"
    title={selectionLabel}
    on:click={selectSelf}
    on:keydown={handleKeydown}
  >
    {#if rendered}
      {@html rendered}
    {:else}
      {fallback ?? tex}
    {/if}
  </span>
{:else}
  <span class={`math-tex ${className}`.trim()} aria-label={ariaLabel}>
    {#if rendered}
      {@html rendered}
    {:else}
      {fallback ?? tex}
    {/if}
  </span>
{/if}

<style>
  .math-tex {
    display: inline-flex;
    align-items: baseline;
    max-width: 100%;
    vertical-align: baseline;
  }

  .math-tex-selectable {
    cursor: copy;
    user-select: text;
  }

  .math-tex-selectable:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }

  .math-tex :global(.katex) {
    font-size: 1em;
    line-height: 1;
  }
</style>
