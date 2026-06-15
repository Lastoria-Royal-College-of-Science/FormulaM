<script lang="ts">
  const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;
</script>

<header class="mb-6 text-center">
  <img class="max-h-[140px] w-[min(560px,88vw)] object-contain" src={logoSrc} alt="FormulaM" data-hero-logo />
  <p class="mx-auto mt-3 max-w-[760px] text-muted leading-6">Enumerate candidate formulae from observed m/z, then import peak lists, annotate selected spectrum peaks, and export labeled mass spectra entirely in the browser.</p>
</header>
