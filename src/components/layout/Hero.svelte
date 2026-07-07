<script lang="ts">
  import { brandAssetPath } from "../../core/dom/brandAssets";
  import { MZ_TEX } from "../../core/math/tex";
  import type { ThemeName } from "../../core/types";
  import MathTex from "../ui/MathTex.svelte";

  export let theme: ThemeName = "dark";

  $: logoSrc = brandAssetPath("logo", theme);
</script>

<header class="mb-6 text-center">
  <img class="hero-logo" src={logoSrc} alt="FormulaM" data-hero-logo="true" />
  <p class="mx-auto mt-3 max-w-[760px] text-muted leading-6">
    Enumerate candidate formulae from observed <MathTex
      tex={MZ_TEX}
      ariaLabel="m/z"
      fallback="m/z"
    />, explicit charge, tolerance, element bounds, and isotope restrictions.
  </p>
</header>
