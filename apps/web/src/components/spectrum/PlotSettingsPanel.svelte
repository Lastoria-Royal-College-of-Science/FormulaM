<script lang="ts">
  import { X_MAX_TEX, X_MIN_TEX, Y_MAX_TEX } from "../../core/math/tex";
  import { resolvePlotAutoValues } from "../../core/plot/plotTicks";
  import type {
    PlotLabelFilter,
    PlotLabelMode,
    PlotSettings,
    SpectrumPeak,
  } from "../../core/types";
  import { disabledTitle } from "../ui/disabledTitle";
  import MathTex from "../ui/MathTex.svelte";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";

  export let settings: PlotSettings;
  export let peaks: SpectrumPeak[] = [];
  export let onChange: (patch: Partial<PlotSettings>) => void;

  $: autoValues = resolvePlotAutoValues(peaks, settings);

  function parseOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function updateLabelMode(mode: PlotLabelMode): void {
    onChange({
      labelMode: mode,
      showFormulaLabels: mode === "formula" || mode === "formula+mz",
      showPeakMzLabels: mode === "mz" || mode === "formula+mz",
    });
  }

  function updateLabelFilter(filter: PlotLabelFilter): void {
    onChange({
      labelFilter: filter,
      showLabels: filter !== "none",
    });
  }

  function formatNumber(value: number): string {
    if (!Number.isFinite(value)) return "";
    if (Number.isInteger(value)) return value.toString();
    return Number(value.toPrecision(6)).toString();
  }

  function autoValue(value: number): string {
    return `${formatNumber(value)} (auto)`;
  }

  function updateFixedYMaxEnabled(value: boolean): void {
    onChange({
      yScale: value ? "fixed" : "auto",
      yMax: value && !settings.yMax ? autoValues.yMax : settings.yMax,
    });
  }

  function updateManualTickSpacingEnabled(value: boolean): void {
    onChange({
      autoTicks: !value,
      majorTickSpacing:
        value && !settings.majorTickSpacing
          ? autoValues.majorTickSpacing
          : settings.majorTickSpacing,
    });
  }

  function updateManualThresholdEnabled(value: boolean): void {
    onChange({ thresholdEnabled: value });
  }
</script>

<section class="ui-card">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="mt-0">Plot settings</h2>
      <p class="mb-0 mt-1 text-sm text-muted">
        Adjust view range, tick spacing, peak styling, threshold, and label rendering.
      </p>
    </div>
  </div>

  <div class="mt-4 grid grid-cols-4 gap-4 lt-lg:grid-cols-2 lt-md:grid-cols-1">
    <div class="block">
      <span class="field-title"><MathTex tex={X_MIN_TEX} ariaLabel="x min" fallback="x min" /></span
      >
      <input
        class="field-control"
        type="number"
        step="0.0001"
        value={settings.xMin ?? ""}
        aria-label="x min"
        on:input={(event) =>
          onChange({ xMin: parseOptionalNumber((event.currentTarget as HTMLInputElement).value) })}
      />
    </div>
    <div class="block">
      <span class="field-title"><MathTex tex={X_MAX_TEX} ariaLabel="x max" fallback="x max" /></span
      >
      <input
        class="field-control"
        type="number"
        step="0.0001"
        value={settings.xMax ?? ""}
        aria-label="x max"
        on:input={(event) =>
          onChange({ xMax: parseOptionalNumber((event.currentTarget as HTMLInputElement).value) })}
      />
    </div>
    <div class="block">
      <span class="field-title"><MathTex tex={Y_MAX_TEX} ariaLabel="y max" fallback="y max" /></span
      >
      <div class="flex items-center gap-3">
        <ToggleSwitch
          ariaLabel="y scale"
          checked={settings.yScale === "fixed"}
          onChange={updateFixedYMaxEnabled}
        />
        <input
          class="field-control min-w-0 flex-1"
          type={settings.yScale === "fixed" ? "number" : "text"}
          min="1"
          step="1"
          value={settings.yScale === "fixed" ? (settings.yMax ?? "") : autoValue(autoValues.yMax)}
          aria-label="y max"
          title={disabledTitle(
            settings.yScale === "auto",
            "Enable fixed y scale before editing y max.",
          )}
          disabled={settings.yScale === "auto"}
          on:input={(event) =>
            onChange({
              yMax: parseOptionalNumber((event.currentTarget as HTMLInputElement).value),
            })}
        />
      </div>
    </div>
    <div class="block">
      <span class="field-title">Line width</span>
      <input
        class="field-control"
        type="number"
        min="1"
        max="8"
        step="0.5"
        value={settings.lineWidth}
        aria-label="Line width"
        on:input={(event) =>
          onChange({
            lineWidth: Math.max(1, Number((event.currentTarget as HTMLInputElement).value) || 1),
          })}
      />
    </div>
  </div>

  <div class="mt-4 grid grid-cols-4 gap-4 lt-lg:grid-cols-2 lt-md:grid-cols-1">
    <div class="block">
      <span class="field-title">Peak color</span>
      <input
        class="field-control h-[44px] p-2"
        type="color"
        value={settings.peakColor}
        aria-label="Peak color"
        on:input={(event) =>
          onChange({ peakColor: (event.currentTarget as HTMLInputElement).value })}
      />
    </div>
    <div class="block">
      <span class="field-title">Selected peak color</span>
      <input
        class="field-control h-[44px] p-2"
        type="color"
        value={settings.selectedPeakColor}
        aria-label="Selected peak color"
        on:input={(event) =>
          onChange({ selectedPeakColor: (event.currentTarget as HTMLInputElement).value })}
      />
    </div>
    <div class="block">
      <span class="field-title">Assigned peak color</span>
      <input
        class="field-control h-[44px] p-2"
        type="color"
        value={settings.assignedPeakColor}
        aria-label="Assigned peak color"
        on:input={(event) =>
          onChange({ assignedPeakColor: (event.currentTarget as HTMLInputElement).value })}
      />
    </div>
  </div>

  <div class="mt-4 grid grid-cols-4 gap-4 lt-lg:grid-cols-2 lt-md:grid-cols-1">
    <div class="block">
      <span class="field-title">Major tick spacing</span>
      <div class="flex items-center gap-3">
        <ToggleSwitch
          ariaLabel="Use fixed major tick spacing"
          checked={!settings.autoTicks}
          onChange={updateManualTickSpacingEnabled}
        />
        <input
          class="field-control min-w-0 flex-1"
          type={!settings.autoTicks ? "number" : "text"}
          min="0.0001"
          step="0.0001"
          value={!settings.autoTicks
            ? (settings.majorTickSpacing ?? "")
            : autoValue(autoValues.majorTickSpacing)}
          aria-label="Major tick spacing"
          title={disabledTitle(
            settings.autoTicks,
            "Enable fixed major tick spacing before editing this value.",
          )}
          disabled={settings.autoTicks}
          on:input={(event) =>
            onChange({
              majorTickSpacing: parseOptionalNumber(
                (event.currentTarget as HTMLInputElement).value,
              ),
            })}
        />
      </div>
    </div>
    <div class="block">
      <span class="field-title">Threshold %</span>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="round-control rounded-[10px]"
          aria-label={settings.thresholdEnabled ? "Hide threshold" : "Show threshold"}
          aria-pressed={settings.thresholdEnabled}
          on:click={() => updateManualThresholdEnabled(!settings.thresholdEnabled)}
        >
          <span
            class={`h-5 w-5 ${settings.thresholdEnabled ? "i-mdi-eye-outline" : "i-mdi-eye-off-outline"}`}
            aria-hidden="true"
          ></span>
        </button>
        <input
          class="field-control min-w-0 flex-1"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={settings.thresholdPercent}
          aria-label="Threshold percent"
          on:input={(event) =>
            onChange({
              thresholdPercent: Math.min(
                100,
                Math.max(0, Number((event.currentTarget as HTMLInputElement).value) || 0),
              ),
            })}
        />
      </div>
    </div>
    <div class="block">
      <span class="field-title">Label content</span>
      <select
        class="field-control field-select"
        value={settings.labelMode}
        aria-label="Label content"
        on:change={(event) =>
          updateLabelMode((event.currentTarget as HTMLSelectElement).value as PlotLabelMode)}
      >
        <option value="formula">formula only</option>
        <option value="mz">m/z only</option>
        <option value="formula+mz">formula + m/z</option>
      </select>
    </div>
    <div class="block">
      <span class="field-title">Label target</span>
      <select
        class="field-control field-select"
        value={settings.labelFilter}
        aria-label="Label target"
        on:change={(event) =>
          updateLabelFilter((event.currentTarget as HTMLSelectElement).value as PlotLabelFilter)}
      >
        <option value="none">none</option>
        <option value="assigned-only">assigned peaks only</option>
        <option value="threshold">threshold-filtered peaks</option>
        <option value="both">both</option>
      </select>
    </div>
  </div>
</section>
