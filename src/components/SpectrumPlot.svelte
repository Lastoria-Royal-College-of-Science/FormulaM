<script lang="ts">
  import { getPlotMargins, renderSpectrumPlot } from "../core/exportSpectrum";
  import { findNearestPeak } from "../core/peakSelection";
  import { resolvePlotDomain } from "../core/plotTicks";
  import type { PlotSettings, SpectrumPeak, ThemeName } from "../core/types";

  export let peaks: SpectrumPeak[] = [];
  export let settings: PlotSettings;
  export let theme: ThemeName = "dark";
  export let selectedPeakId: string | null = null;
  export let onSelectPeak: (peak: SpectrumPeak) => void;
  export let onResetView: () => void;

  let canvas: HTMLCanvasElement;
  let containerWidth = 0;
  let hoveredPeak: SpectrumPeak | null = null;
  let tooltipX = 0;
  let tooltipY = 0;

  const plotHeight = 440;

  function drawPlot(): void {
    if (!canvas || containerWidth <= 0) return;

    const width = Math.max(320, containerWidth);
    const height = plotHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * devicePixelRatio);
    canvas.height = Math.floor(height * devicePixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(devicePixelRatio, devicePixelRatio);

    renderSpectrumPlot(context, {
      peaks,
      settings,
      width,
      height,
      selectedPeakId,
      hoveredPeakId: hoveredPeak?.id ?? null,
      theme,
    });
  }

  function eventToMz(event: MouseEvent): number | null {
    if (!canvas || !peaks.length) return null;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const margins = getPlotMargins();
    const plotLeft = margins.left;
    const plotWidth = width - margins.left - margins.right;
    if (x < plotLeft || x > plotLeft + plotWidth) return null;

    const domain = resolvePlotDomain(peaks, settings);
    const xRatio = (x - plotLeft) / plotWidth;
    return domain.xMin + xRatio * (domain.xMax - domain.xMin);
  }

  function handlePointerMove(event: MouseEvent): void {
    const mz = eventToMz(event);
    if (mz === null) {
      hoveredPeak = null;
      return;
    }

    const domain = resolvePlotDomain(peaks, settings);
    hoveredPeak = findNearestPeak(peaks, mz, domain.xMin, domain.xMax);
    tooltipX = event.offsetX + 14;
    tooltipY = Math.max(10, event.offsetY - 10);
  }

  function handlePointerLeave(): void {
    hoveredPeak = null;
  }

  function handleClick(): void {
    if (hoveredPeak) onSelectPeak(hoveredPeak);
  }

  $: if (canvas) {
    peaks;
    settings;
    theme;
    selectedPeakId;
    hoveredPeak;
    containerWidth;
    drawPlot();
  }
</script>

<section class="ui-card">
  <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="mt-0">Interactive spectrum</h2>
      <p class="mb-0 mt-1 text-sm text-muted">Click the nearest peak to load its m/z into FormulaM and prepare a formula assignment.</p>
    </div>
    <button type="button" class="secondary-action" disabled={peaks.length === 0} on:click={onResetView}>Reset view</button>
  </div>

  {#if peaks.length}
    <div class="relative">
      <div bind:clientWidth={containerWidth} class="w-full">
        <canvas
          bind:this={canvas}
          class="block w-full rounded-2 border border-solid border-border"
          on:mousemove={handlePointerMove}
          on:mouseleave={handlePointerLeave}
          on:click={handleClick}
        ></canvas>
      </div>

      {#if hoveredPeak}
        <div
          class="pointer-events-none absolute z-10 rounded-2 border border-solid border-border bg-surface px-3 py-2 text-sm shadow-app"
          style={`left: min(${tooltipX}px, calc(100% - 190px)); top: ${tooltipY}px;`}
        >
          <div><strong class="text-text">m/z</strong> {hoveredPeak.mz.toFixed(6)}</div>
          <div><strong class="text-text">Intensity</strong> {hoveredPeak.intensity}</div>
          <div><strong class="text-text">Relative</strong> {hoveredPeak.relativeIntensity.toFixed(2)}%</div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="rounded-2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
      Import a peak list to render the spectrum plot.
    </div>
  {/if}
</section>
