<script lang="ts">
  import MathTex from "../ui/MathTex.svelte";
  import { MZ_TEX } from "../../core/math/tex";
  import type { ThemeName } from "../../core/types";

  export let theme: ThemeName = "dark";
  const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;
</script>

<header class="mb-6 text-center">
  <img
    class={`hero-logo ${theme === "dark" ? "brand-logo-dark" : "brand-logo-light"}`}
    src={logoSrc}
    alt="FormulaM"
    data-hero-logo="true"
  />
  <p class="mx-auto mt-3 max-w-[760px] text-muted leading-6">Enumerate candidate formulae from observed <MathTex tex={MZ_TEX} ariaLabel="m/z" fallback="m/z" />, explicit charge, tolerance, element bounds, and isotope restrictions.</p>
</header>
