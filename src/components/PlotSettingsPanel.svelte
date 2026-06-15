<script lang="ts">
  import ToggleSwitch from "./ToggleSwitch.svelte";
  import type { PlotLabelFilter, PlotLabelMode, PlotSettings } from "../core/types";

  export let settings: PlotSettings;
  export let disabled = false;
  export let onChange: (patch: Partial<PlotSettings>) => void;

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
    onChange({ labelFilter: filter });
  }
</script>

<section class="ui-card">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="mt-0">Plot settings</h2>
      <p class="mb-0 mt-1 text-sm text-muted">Adjust view range, tick spacing, peak styling, threshold, and label rendering.</p>
    </div>
  </div>

  <div class="mt-4 grid grid-cols-4 gap-4 lt-lg:grid-cols-2 lt-md:grid-cols-1">
    <label class="block">
      <span class="field-title">xMin</span>
      <input
        class="field-control"
        type="number"
        step="0.0001"
        value={settings.xMin ?? ""}
        disabled={disabled}
        on:input={(event) => onChange({ xMin: parseOptionalNumber((event.currentTarget as HTMLInputElement).value) })}
      />
    </label>
    <label class="block">
      <span class="field-title">xMax</span>
      <input
        class="field-control"
        type="number"
        step="0.0001"
        value={settings.xMax ?? ""}
        disabled={disabled}
        on:input={(event) => onChange({ xMax: parseOptionalNumber((event.currentTarget as HTMLInputElement).value) })}
      />
    </label>
    <label class="block">
      <span class="field-title">Y scale</span>
      <select
        class="field-control field-select"
        value={settings.yScale}
        disabled={disabled}
        on:change={(event) => onChange({ yScale: (event.currentTarget as HTMLSelectElement).value as PlotSettings["yScale"] })}
      >
        <option value="auto">auto</option>
        <option value="fixed">fixed</option>
      </select>
    </label>
    <label class="block">
      <span class="field-title">Fixed yMax</span>
      <input
        class="field-control"
        type="number"
        min="1"
        step="1"
        value={settings.yMax ?? ""}
        disabled={disabled || settings.yScale === "auto"}
        on:input={(event) => onChange({ yMax: parseOptionalNumber((event.currentTarget as HTMLInputElement).value) })}
      />
    </label>
  </div>

  <div class="mt-4 grid grid-cols-4 gap-4 lt-lg:grid-cols-2 lt-md:grid-cols-1">
    <label class="block">
      <span class="field-title">Peak color</span>
      <input class="field-control h-[44px] p-2" type="color" value={settings.peakColor} disabled={disabled} on:input={(event) => onChange({ peakColor: (event.currentTarget as HTMLInputElement).value })} />
    </label>
    <label class="block">
      <span class="field-title">Selected peak color</span>
      <input class="field-control h-[44px] p-2" type="color" value={settings.selectedPeakColor} disabled={disabled} on:input={(event) => onChange({ selectedPeakColor: (event.currentTarget as HTMLInputElement).value })} />
    </label>
    <label class="block">
      <span class="field-title">Assigned peak color</span>
      <input class="field-control h-[44px] p-2" type="color" value={settings.assignedPeakColor} disabled={disabled} on:input={(event) => onChange({ assignedPeakColor: (event.currentTarget as HTMLInputElement).value })} />
    </label>
    <label class="block">
      <span class="field-title">Line width</span>
      <input
        class="field-control"
        type="number"
        min="1"
        max="8"
        step="0.5"
        value={settings.lineWidth}
        disabled={disabled}
        on:input={(event) => onChange({ lineWidth: Math.max(1, Number((event.currentTarget as HTMLInputElement).value) || 1) })}
      />
    </label>
  </div>

  <div class="mt-4 grid grid-cols-4 gap-4 lt-lg:grid-cols-2 lt-md:grid-cols-1">
    <div class:toggle-control-disabled={disabled} class="toggle-control">
      <ToggleSwitch
        ariaLabel="Auto ticks"
        checked={settings.autoTicks}
        disabled={disabled}
        onChange={(value) => onChange({ autoTicks: value })}
      />
      <span class="field-title m-0">Auto ticks</span>
    </div>
    <label class="block">
      <span class="field-title">Major tick spacing</span>
      <input
        class="field-control"
        type="number"
        min="0.0001"
        step="0.0001"
        value={settings.majorTickSpacing ?? ""}
        disabled={disabled || settings.autoTicks}
        on:input={(event) => onChange({ majorTickSpacing: parseOptionalNumber((event.currentTarget as HTMLInputElement).value) })}
      />
    </label>
    <div class:toggle-control-disabled={disabled} class="toggle-control">
      <ToggleSwitch
        ariaLabel="Threshold"
        checked={settings.thresholdEnabled}
        disabled={disabled}
        onChange={(value) => onChange({ thresholdEnabled: value })}
      />
      <span class="field-title m-0">Threshold</span>
    </div>
    <label class="block">
      <span class="field-title">Threshold %</span>
      <input
        class="field-control"
        type="number"
        min="0"
        max="100"
        step="0.1"
        value={settings.thresholdPercent}
        disabled={disabled || !settings.thresholdEnabled}
        on:input={(event) => onChange({ thresholdPercent: Math.min(100, Math.max(0, Number((event.currentTarget as HTMLInputElement).value) || 0)) })}
      />
    </label>
  </div>

  <div class="mt-4 grid grid-cols-3 gap-4 lt-lg:grid-cols-2 lt-md:grid-cols-1">
    <div class:toggle-control-disabled={disabled} class="toggle-control">
      <ToggleSwitch
        ariaLabel="Show labels"
        checked={settings.showLabels}
        disabled={disabled}
        onChange={(value) => onChange({ showLabels: value })}
      />
      <span class="field-title m-0">Show labels</span>
    </div>
    <label class="block">
      <span class="field-title">Label content</span>
      <select class="field-control field-select" value={settings.labelMode} disabled={disabled || !settings.showLabels} on:change={(event) => updateLabelMode((event.currentTarget as HTMLSelectElement).value as PlotLabelMode)}>
        <option value="formula">formula only</option>
        <option value="mz">m/z only</option>
        <option value="formula+mz">formula + m/z</option>
      </select>
    </label>
    <label class="block">
      <span class="field-title">Label target</span>
      <select class="field-control field-select" value={settings.labelFilter} disabled={disabled || !settings.showLabels} on:change={(event) => updateLabelFilter((event.currentTarget as HTMLSelectElement).value as PlotLabelFilter)}>
        <option value="assigned-only">assigned peaks only</option>
        <option value="threshold">threshold-filtered peaks</option>
      </select>
    </label>
  </div>
</section>
