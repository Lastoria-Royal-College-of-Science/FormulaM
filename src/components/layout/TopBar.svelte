<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import type { ThemeName } from "../../core/types";

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
      <img
        class={`topbar-brand-mark ${isDark ? "brand-logo-dark" : "brand-logo-light"}`}
        src={brandMarkSrc}
        alt=""
        aria-hidden="true"
      />
      <span class="topbar-brand-copy">FormulaM</span>
    </a>

    <nav class="topbar-actions" aria-label="Page controls">
      <a
        class="round-control round-link-control no-underline font-[650]"
        class:topbar-control-solid={isBrandVisible}
        class:topbar-control-glass={!isBrandVisible}
        href="https://github.com/Lastoria-Royal-College-of-Science/FormulaM"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open FormulaM on GitHub"
      >
        <span class="i-mdi-github h-5 w-5" aria-hidden="true"></span>
      </a>
      <button
        type="button"
        class="round-control cursor-pointer"
        class:topbar-control-solid={isBrandVisible}
        class:topbar-control-glass={!isBrandVisible}
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

<style>
  .topbar-shell {
    position: sticky;
    top: 0;
    z-index: 40;
    width: 100%;
    overflow-x: clip;
    background: transparent;
  }

  .topbar-shell::before,
  .topbar-shell::after {
    pointer-events: none;
    position: absolute;
    opacity: 0;
    transition: opacity 200ms ease-out;
    content: "";
  }

  .topbar-shell::before {
    top: -1.5rem;
    right: -2rem;
    bottom: 0;
    left: -2rem;
    background: color-mix(in srgb, var(--surface), transparent 28%);
    -webkit-backdrop-filter: blur(24px) saturate(150%);
    backdrop-filter: blur(24px) saturate(150%);
  }

  .topbar-shell::after {
    right: 0;
    bottom: 0;
    left: 0;
    height: 1px;
    background: color-mix(in srgb, var(--border), transparent 14%);
  }

  .topbar-shell-scrolled::before,
  .topbar-shell-scrolled::after {
    opacity: 1;
  }

  .topbar-control-solid,
  .topbar-control-glass {
    transition:
      background-color 200ms ease-out,
      border-color 200ms ease-out,
      backdrop-filter 200ms ease-out;
  }

  .topbar-control-solid {
    border-color: var(--control-border);
    background: var(--control-bg);
  }

  .topbar-control-glass {
    border-color: color-mix(in srgb, var(--border), transparent 14%);
    background-color: color-mix(in srgb, var(--surface), transparent 40%);
    -webkit-backdrop-filter: blur(10px) saturate(135%);
    backdrop-filter: blur(10px) saturate(135%);
  }

  .topbar-control-solid:hover,
  .topbar-control-glass:hover {
    border-color: var(--accent);
  }
</style>
