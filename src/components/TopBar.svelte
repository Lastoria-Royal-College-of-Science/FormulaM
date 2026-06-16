<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { ThemeName } from "../core/types";

  export let theme: ThemeName = "dark";
  export let onToggleTheme: () => void;

  const brandMarkSrc = `${import.meta.env.BASE_URL}favicon.svg`;

  let isBrandVisible = false;
  let topbarShell: HTMLElement | null = null;
  let heroLogo: HTMLImageElement | null = null;

  $: isDark = theme === "dark";

  function syncTopBarState(): void {
    if (!heroLogo) heroLogo = document.querySelector<HTMLImageElement>("[data-hero-logo]");

    const topbarBottom = topbarShell?.getBoundingClientRect().bottom ?? 0;
    const heroLogoBottom = heroLogo?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY;
    const nextBrandVisible = heroLogo ? heroLogoBottom <= topbarBottom : true;

    if (nextBrandVisible !== isBrandVisible) isBrandVisible = nextBrandVisible;
  }

  onMount(() => {
    heroLogo = document.querySelector<HTMLImageElement>("[data-hero-logo]");
    syncTopBarState();
    window.addEventListener("scroll", syncTopBarState, { passive: true });
    window.addEventListener("resize", syncTopBarState);
    heroLogo?.addEventListener("load", syncTopBarState);
  });

  onDestroy(() => {
    window.removeEventListener("scroll", syncTopBarState);
    window.removeEventListener("resize", syncTopBarState);
    heroLogo?.removeEventListener("load", syncTopBarState);
  });
</script>

<header bind:this={topbarShell} class="topbar-shell" class:topbar-shell-scrolled={isBrandVisible}>
  <div class="topbar-frame">
    <a
      class={`topbar-brand transition-opacity duration-200 ${isBrandVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      href="#top"
    >
      <img class="topbar-brand-mark" src={brandMarkSrc} alt="" aria-hidden="true" />
      <span class="topbar-brand-copy">FormulaM</span>
    </a>

    <nav class="topbar-actions" aria-label="Page controls">
      <a
        class={`round-control no-underline font-[650] ${isBrandVisible ? "topbar-control-solid" : "topbar-control-glass"}`}
        href="https://github.com/Lastoria-Royal-College-of-Science/FormulaM"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open FormulaM on GitHub"
      >
        <span class="i-mdi-github h-5 w-5" aria-hidden="true"></span>
      </a>
      <button
        type="button"
        class={`round-control cursor-pointer ${isBrandVisible ? "topbar-control-solid" : "topbar-control-glass"}`}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
        on:click={onToggleTheme}
      >
        {#if isDark}
          <span class="i-mdi-weather-night h-[18px] w-[18px]" aria-hidden="true"></span>
        {:else}
          <span class="i-mdi-white-balance-sunny h-[18px] w-[18px]" aria-hidden="true"></span>
        {/if}
      </button>
    </nav>
  </div>
</header>
