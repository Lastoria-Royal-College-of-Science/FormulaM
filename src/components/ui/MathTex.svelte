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
  $: modeClass = displayMode ? "math-tex-display" : "math-tex-inline";
  $: rootClass = ["math-tex", modeClass, selectable ? "math-tex-selectable" : "", className]
    .filter(Boolean)
    .join(" ");

  function renderTex(value: string, isDisplayMode: boolean): string {
    try {
      return renderTexToHtml(value, isDisplayMode);
    } catch {
      return "";
    }
  }

  function selectSelf(): void {
    if (!selectable || !root) return;
    selectElementContents(root.querySelector<HTMLElement>(".katex-html") ?? root);
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
    class={rootClass}
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
  <span class={rootClass} aria-label={ariaLabel}>
    {#if rendered}
      {@html rendered}
    {:else}
      {fallback ?? tex}
    {/if}
  </span>
{/if}

<style>
  .math-tex {
    max-width: 100%;
    vertical-align: baseline;
  }

  .math-tex-inline {
    display: inline-flex;
    align-items: baseline;
  }

  .math-tex-display {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    text-align: center;
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

  .math-tex :global(.katex-mathml) {
    user-select: none;
  }

  .math-tex :global(.katex-html) {
    user-select: text;
  }

  .math-tex :global(.katex-html [style*="color:transparent"]),
  .math-tex :global(.katex-html [style*="color: transparent"]),
  .math-tex :global(.katex-html [style*="color:transparent"] *),
  .math-tex :global(.katex-html [style*="color: transparent"] *) {
    -webkit-user-select: none;
    user-select: none;
  }

  .math-tex-display :global(.katex-display) {
    margin: 0;
    max-width: 100%;
  }
</style>
