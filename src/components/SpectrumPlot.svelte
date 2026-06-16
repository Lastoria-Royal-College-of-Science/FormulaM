<script lang="ts">
  import { createSpectrumPlotScene, getPlotMargins } from "../core/exportSpectrum";
  import { findNearestPeak } from "../core/peakSelection";
  import { filterPeaksInRange, resolvePlotDomain } from "../core/plotTicks";
  import type { PlotScene, PlotText } from "../core/exportSpectrum";
  import type { PlotSettings, SpectrumPeak, ThemeName } from "../core/types";

  export let peaks: SpectrumPeak[] = [];
  export let settings: PlotSettings;
  export let theme: ThemeName = "dark";
  export let selectedPeakId: string | null = null;
  export let onSelectPeak: (peak: SpectrumPeak) => void;
  export let onResetView: () => void;

  let plotFrame: HTMLButtonElement;
  let containerWidth = 0;
  let hoveredPeak: SpectrumPeak | null = null;
  let tooltipX = 0;
  let tooltipY = 0;
  const plotHeight = 440;
  let plotWidth = 320;
  let scene: PlotScene = createSpectrumPlotScene({
    peaks,
    settings,
    width: plotWidth,
    height: plotHeight,
    selectedPeakId,
    hoveredPeakId: null,
    theme,
  });

  function textAnchor(align: PlotText["align"]): "start" | "middle" | "end" {
    if (align === "center") return "middle";
    if (align === "right" || align === "end") return "end";
    return "start";
  }

  function dominantBaseline(baseline: PlotText["baseline"]): string {
    if (baseline === "top" || baseline === "hanging") return "text-before-edge";
    if (baseline === "middle") return "middle";
    if (baseline === "bottom" || baseline === "ideographic") return "text-after-edge";
    return "alphabetic";
  }

  function textRotation(shape: PlotText): string | undefined {
    return shape.rotation ? `rotate(${shape.rotation} ${shape.x} ${shape.y})` : undefined;
  }

  function eventToMz(event: MouseEvent): number | null {
    if (!plotFrame || !peaks.length) return null;
    const rect = plotFrame.getBoundingClientRect();
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
    if (mz === null || !plotFrame) {
      hoveredPeak = null;
      return;
    }

    const rect = plotFrame.getBoundingClientRect();
    const domain = resolvePlotDomain(peaks, settings);
    hoveredPeak = findNearestPeak(peaks, mz, domain.xMin, domain.xMax);
    tooltipX = event.clientX - rect.left + 14;
    tooltipY = Math.max(10, event.clientY - rect.top - 10);
  }

  function handlePointerLeave(): void {
    hoveredPeak = null;
  }

  function handleClick(): void {
    if (hoveredPeak) onSelectPeak(hoveredPeak);
  }

  function visiblePeaks(): SpectrumPeak[] {
    const domain = resolvePlotDomain(peaks, settings);
    return filterPeaksInRange(peaks, domain.xMin, domain.xMax);
  }

  function focusHoveredPeak(): void {
    const visible = visiblePeaks();
    if (!visible.length) return;

    hoveredPeak = visible.find((peak) => peak.id === selectedPeakId) ?? visible[0];
    tooltipX = 20;
    tooltipY = 20;
  }

  function handleFocus(): void {
    if (!hoveredPeak) focusHoveredPeak();
  }

  function handleBlur(): void {
    hoveredPeak = null;
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const visible = visiblePeaks();
    if (!visible.length) return;

    const currentPeakId = hoveredPeak?.id ?? selectedPeakId;
    const currentIndex = Math.max(0, visible.findIndex((peak) => peak.id === currentPeakId));

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      hoveredPeak = visible[Math.max(0, currentIndex - 1)];
      tooltipX = 20;
      tooltipY = 20;
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      hoveredPeak = visible[Math.min(visible.length - 1, currentIndex + 1)];
      tooltipX = 20;
      tooltipY = 20;
      return;
    }

  }

  $: plotWidth = Math.max(320, containerWidth || 0);
  $: scene = createSpectrumPlotScene({
    peaks,
    settings,
    width: plotWidth,
    height: plotHeight,
    selectedPeakId,
    hoveredPeakId: hoveredPeak?.id ?? null,
    theme,
  });
</script>

<section class="ui-card">
  <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="mt-0">Interactive spectrum</h2>
      <p class="mb-0 mt-1 text-sm text-muted">Click the nearest peak to load its <code class="inline-code">m/z</code> into FormulaM and prepare a formula assignment.</p>
    </div>
    <button type="button" class="secondary-action" disabled={peaks.length === 0} on:click={onResetView}>Reset view</button>
  </div>

  {#if peaks.length}
    <div class="relative">
      <button
        bind:this={plotFrame}
        bind:clientWidth={containerWidth}
        aria-label="Spectrum plot. Use left and right arrows to inspect peaks, then press Enter or Space to select one."
        class="block w-full overflow-hidden rounded-2 border border-solid border-border bg-transparent p-0 text-left outline-none"
        style="filter: none;"
        type="button"
        on:focus={handleFocus}
        on:blur={handleBlur}
        on:keydown={handleKeyDown}
        on:mousemove={handlePointerMove}
        on:mouseleave={handlePointerLeave}
        on:click={handleClick}
      >
        <svg
          class="block h-[440px] w-full select-none"
          preserveAspectRatio="none"
          viewBox={`0 0 ${scene.width} ${scene.height}`}
        >
          {#each scene.shapes as shape, index (index)}
            {#if shape.kind === "rect"}
              <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill}></rect>
            {:else if shape.kind === "line"}
              <line
                x1={shape.x1}
                y1={shape.y1}
                x2={shape.x2}
                y2={shape.y2}
                stroke={shape.stroke}
                stroke-dasharray={shape.dash?.join(" ")}
                stroke-width={shape.strokeWidth}
                opacity={shape.opacity ?? 1}
              ></line>
            {:else if shape.kind === "circle"}
              <circle cx={shape.x} cy={shape.y} r={shape.radius} fill={shape.fill}></circle>
            {:else}
              <text
                x={shape.x}
                y={shape.y}
                dominant-baseline={dominantBaseline(shape.baseline)}
                fill={shape.fill}
                font-size={shape.fontSize}
                font-weight={shape.fontWeight === "bold" ? 600 : 400}
                text-anchor={textAnchor(shape.align)}
                transform={textRotation(shape)}
              >{shape.text}</text>
            {/if}
          {/each}
        </svg>
      </button>

      {#if hoveredPeak}
        <div
          class="pointer-events-none absolute z-10 rounded-2 border border-solid border-border bg-surface px-3 py-2 text-sm shadow-app"
          style={`left: min(${tooltipX}px, calc(100% - 190px)); top: ${tooltipY}px;`}
        >
          <div><strong class="text-text"><code class="inline-code">m/z</code></strong> {hoveredPeak.mz.toFixed(6)}</div>
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
