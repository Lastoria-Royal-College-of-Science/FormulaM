<script lang="ts">
  import { tick } from "svelte";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";
  import { canCommitChargeEntryText, formatChargeEntry, formatSignedChargeText, isChargeDraftText } from "../../core/search/chargeInput";
  import type { SearchFormState } from "../../core/types";

  export let form: SearchFormState;
  export let disabled = false;
  export let onChange: (patch: Partial<SearchFormState>) => void;
  export let onChargeInputTextChange: (value: string) => void;
  export let onChargeEditTextChange: (value: string) => void;
  export let onCommitChargeInput: () => void;
  export let onCommitChargeEdit: () => void;
  export let onCancelChargeEdit: () => void;
  export let onRemoveChargeEntry: (entryId: string) => void;
  export let onStartChargeEdit: (entryId: string) => void;

  let activeEditChip: HTMLDivElement | null = null;
  let chargeEditInput: HTMLInputElement | null = null;
  let chargeHelpDialog: HTMLDialogElement;
  let ppmHelpDialog: HTMLDialogElement;
  let focusedChargeEditId: string | null = null;

  function openChargeHelp(): void {
    chargeHelpDialog?.showModal();
  }

  function openPpmHelp(): void {
    ppmHelpDialog?.showModal();
  }

  function handleCommitKeydown(event: KeyboardEvent, onCommit: () => void, ready: boolean): void {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (ready && !disabled) onCommit();
  }

  function signedChargeText(text: string): string {
    return formatSignedChargeText(form.chargeSign, text);
  }

  function toggleChargeSign(): void {
    onChange({ chargeSign: form.chargeSign === "+" ? "-" : "+" });
  }

  function chargeTextWidth(text: string, minimum = 1): string {
    return `width: ${Math.max(text.length, minimum)}ch;`;
  }

  function moveCaretToEnd(input: HTMLInputElement): void {
    const end = input.value.length;
    input.focus();
    input.setSelectionRange(end, end);
  }

  function handleChargeEditKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancelChargeEdit();
      return;
    }
    handleCommitKeydown(event, onCommitChargeEdit, canCommitChargeEntryText(form.chargeEditText));
  }

  function handleDocumentPointerDown(event: PointerEvent): void {
    if (!form.chargeEditId || !activeEditChip) return;
    if (!(event.target instanceof Node)) return;
    if (activeEditChip.contains(event.target)) return;
    onCancelChargeEdit();
  }

  $: if (!form.chargeEditId) {
    focusedChargeEditId = null;
  }

  $: if (form.chargeEditId && form.chargeEditId !== focusedChargeEditId) {
    focusedChargeEditId = form.chargeEditId;
    tick().then(() => {
      if (chargeEditInput) moveCaretToEnd(chargeEditInput);
    });
  }
</script>

<svelte:document on:pointerdown|capture={handleDocumentPointerDown} />

<section class="ui-card" aria-label="Search inputs">
  <h2 class="mt-0">Search inputs</h2>
  <div class="grid grid-cols-3 gap-4 lt-md:grid-cols-1">
    <div class="block">
      <span class="field-title">Observed <code class="inline-code">m/z</code></span>
      <input
        class="field-control"
        type="text"
        inputmode="decimal"
        value={form.mz}
        aria-label="Observed m/z"
        disabled={disabled}
        on:input={(event) => onChange({ mz: (event.currentTarget as HTMLInputElement).value })}
      />
    </div>
    <div class="block col-span-2 lt-md:col-span-1">
      <div class="mb-1.5">
        <div class="field-title m-0 flex items-center gap-1.25">
          <span>Explicit charge</span>
          <button class="help-button" type="button" aria-label="Explicit charge help" on:click={openChargeHelp}>
            <span class="help-button-icon i-mdi-help" aria-hidden="true"></span>
          </button>
        </div>
      </div>
      <div class:charge-field-shell-disabled={disabled} class="charge-field-shell">
        <button
          type="button"
          class="charge-polarity-switch"
          role="switch"
          aria-checked={form.chargeSign === "+"}
          aria-label={form.chargeSign === "+" ? "Charge polarity is positive. Click to switch to negative charges." : "Charge polarity is negative. Click to switch to positive charges."}
          disabled={disabled}
          on:click={toggleChargeSign}
        >
          <span class="charge-polarity-thumb" class:charge-polarity-thumb-positive={form.chargeSign === "+"}></span>
          <span
            class="charge-polarity-mark charge-polarity-mark-negative"
            class:charge-polarity-mark-active={form.chargeSign === "-"}
            class:charge-polarity-mark-inactive={form.chargeSign !== "-"}
          >
            <span class="charge-polarity-icon i-mdi-minus" aria-hidden="true"></span>
          </span>
          <span
            class="charge-polarity-mark charge-polarity-mark-positive"
            class:charge-polarity-mark-active={form.chargeSign === "+"}
            class:charge-polarity-mark-inactive={form.chargeSign !== "+"}
          >
            <span class="charge-polarity-icon i-mdi-add" aria-hidden="true"></span>
          </span>
        </button>
        <div class="charge-entry-flow">
          <div class="charge-chip-list" aria-label="Selected charges">
            {#each form.chargeEntries as entry (entry.id)}
              {#if form.chargeEditId === entry.id}
                <div bind:this={activeEditChip} class="charge-chip charge-chip-editing">
                  <div class="charge-chip-target charge-chip-editor">
                    <input
                      bind:this={chargeEditInput}
                      class="charge-chip-input"
                      style={chargeTextWidth(form.chargeEditText, 2)}
                      type="text"
                      inputmode="numeric"
                      value={form.chargeEditText}
                      disabled={disabled}
                      aria-label={`Edit ${signedChargeText(entry.text)}`}
                      on:input={(event) => {
                        const value = (event.currentTarget as HTMLInputElement).value;
                        if (isChargeDraftText(value)) onChargeEditTextChange(value);
                      }}
                      on:keydown={handleChargeEditKeydown}
                    />
                  </div>
                  <button
                    type="button"
                    class="charge-chip-action"
                    aria-label={`Confirm ${signedChargeText(form.chargeEditText || entry.text)} changes`}
                    disabled={disabled || !canCommitChargeEntryText(form.chargeEditText)}
                    on:click={onCommitChargeEdit}
                  >
                    <span class="charge-chip-icon i-codex-check" aria-hidden="true"></span>
                  </button>
                </div>
              {:else}
                <div class="charge-chip">
                  <button
                    type="button"
                    class="charge-chip-target"
                    aria-label={`Edit ${signedChargeText(entry.text)}`}
                    disabled={disabled}
                    on:click={() => onStartChargeEdit(entry.id)}
                  >
                    <span class="charge-chip-value">{formatChargeEntry(entry)}</span>
                  </button>
                  <button
                    type="button"
                    class="charge-chip-action"
                    aria-label={`Remove ${signedChargeText(entry.text)}`}
                    disabled={disabled}
                    on:click={() => onRemoveChargeEntry(entry.id)}
                  >
                    <span class="charge-chip-icon i-codex-cross" aria-hidden="true"></span>
                  </button>
                </div>
              {/if}
            {/each}
          </div>
          <div class="charge-draft-shell">
            <input
              class="charge-draft-input"
              type="text"
              inputmode="numeric"
              placeholder="n or min-max"
              value={form.chargeInputText}
              disabled={disabled}
              aria-label="Add charge magnitude or range"
              on:input={(event) => {
                const value = (event.currentTarget as HTMLInputElement).value;
                if (isChargeDraftText(value)) onChargeInputTextChange(value);
              }}
              on:keydown={(event) => handleCommitKeydown(event, onCommitChargeInput, canCommitChargeEntryText(form.chargeInputText))}
            />
            {#if form.chargeInputText}
              <button
                type="button"
                class="charge-draft-action"
                aria-label={`Confirm new ${form.chargeSign === "+" ? "positive" : "negative"} charge`}
                disabled={disabled || !canCommitChargeEntryText(form.chargeInputText)}
                on:click={onCommitChargeInput}
              >
                <span class="charge-chip-icon i-codex-check" aria-hidden="true"></span>
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div class="block">
      <div class="mb-1.5">
        <div class="field-title m-0 flex items-center gap-1.25">
          <span>Tolerance ppm</span>
          <button class="help-button" type="button" aria-label="Tolerance ppm help" on:click={openPpmHelp}>
            <span class="help-button-icon i-mdi-help" aria-hidden="true"></span>
          </button>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ToggleSwitch
          ariaLabel="Enable ppm tolerance"
          checked={form.tolerancePpmEnabled}
          disabled={disabled}
          onChange={(value) => onChange({ tolerancePpmEnabled: value })}
        />
        <input
          id="tolerancePpm"
          class="field-control min-w-0 flex-1"
          type="text"
          inputmode="decimal"
          value={form.tolerancePpm}
          aria-label="Tolerance ppm"
          disabled={disabled || !form.tolerancePpmEnabled}
          on:input={(event) => onChange({ tolerancePpm: (event.currentTarget as HTMLInputElement).value })}
        />
      </div>
    </div>
    <div class="block">
      <div class="mb-1.5">
        <span class="field-title m-0">Tolerance Da</span>
      </div>
      <div class="flex items-center gap-3">
        <ToggleSwitch
          ariaLabel="Enable Da tolerance"
          checked={form.toleranceDaEnabled}
          disabled={disabled}
          onChange={(value) => onChange({ toleranceDaEnabled: value })}
        />
        <input
          id="toleranceDa"
          class="field-control min-w-0 flex-1"
          type="text"
          inputmode="decimal"
          value={form.toleranceDa}
          aria-label="Tolerance Da"
          disabled={disabled || !form.toleranceDaEnabled}
          on:input={(event) => onChange({ toleranceDa: (event.currentTarget as HTMLInputElement).value })}
        />
      </div>
    </div>
    <div class="block">
      <span class="field-title">Max results</span>
      <input
        class="field-control"
        type="number"
        min="1"
        max="5000"
        step="10"
        value={form.maxResults}
        aria-label="Max results"
        disabled={disabled}
        on:input={(event) => onChange({ maxResults: Number((event.currentTarget as HTMLInputElement).value) })}
      />
    </div>
  </div>
  <dialog class="max-w-[520px] rounded-2 border border-solid border-border bg-surface p-4 text-text shadow-app" bind:this={chargeHelpDialog}>
    <form method="dialog" class="m-0">
      <h3 class="mt-0">Explicit charge</h3>
      <p>Enter <code class="inline-code">n</code> for a single charge or <code class="inline-code">min-max</code> for an inclusive range.</p>
      <p>All tags share the same global <code class="inline-code">+</code> or <code class="inline-code">-</code> sign, and every range expands through its upper limit during search.</p>
      <button class="secondary-action">Close</button>
    </form>
  </dialog>
  <dialog class="max-w-[520px] rounded-2 border border-solid border-border bg-surface p-4 text-text shadow-app" bind:this={ppmHelpDialog}>
    <form method="dialog" class="m-0">
      <h3 class="mt-0">Tolerance ppm</h3>
      <p><code class="inline-code">ppm error = (predicted_mz - observed_mz) / observed_mz * 1,000,000</code></p>
      <p>A formula is accepted if the absolute ppm error is within the selected tolerance.</p>
      <button class="secondary-action">Close</button>
    </form>
  </dialog>
</section>

<style>
  .charge-field-shell {
    display: flex;
    height: 42px;
    min-height: 42px;
    align-items: center;
    gap: 0.375rem;
    border: 1px solid var(--control-border);
    border-radius: 10px;
    background: var(--control-bg);
    padding: 0 0.375rem;
    transition:
      border-color 150ms ease-out,
      box-shadow 150ms ease-out,
      filter 150ms ease-out;
  }

  .charge-field-shell:hover {
    filter: var(--interactive-hover-filter);
  }

  .charge-field-shell:active {
    filter: var(--interactive-active-filter);
  }

  .charge-field-shell:focus-within {
    border-color: var(--accent);
    box-shadow: var(--control-glow);
  }

  .charge-field-shell-disabled:hover,
  .charge-field-shell-disabled:active {
    filter: none;
  }

  .charge-field-shell-disabled:focus-within {
    border-color: var(--control-border);
    box-shadow: none;
  }

  .charge-entry-flow {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    gap: 0.5rem;
  }

  .charge-polarity-switch {
    position: relative;
    display: inline-flex;
    height: 1.75rem;
    width: 3rem;
    flex-shrink: 0;
    align-items: center;
    overflow: hidden;
    border: 1px solid var(--control-border);
    border-radius: 9999px;
    background: var(--surface-2);
    padding: 0;
    color: var(--text);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
    outline: none;
  }

  .charge-polarity-switch:focus,
  .charge-polarity-switch:focus-visible,
  .charge-polarity-switch:active,
  .charge-chip-action:focus,
  .charge-chip-action:focus-visible,
  .charge-chip-action:active,
  .charge-draft-action:focus,
  .charge-draft-action:focus-visible,
  .charge-draft-action:active {
    outline: none;
  }

  .charge-polarity-switch:enabled:active,
  .charge-polarity-switch:enabled:focus,
  .charge-polarity-switch:enabled:focus-visible,
  .charge-chip-action:enabled:active,
  .charge-chip-action:enabled:focus,
  .charge-chip-action:enabled:focus-visible,
  .charge-draft-action:enabled:active,
  .charge-draft-action:enabled:focus,
  .charge-draft-action:enabled:focus-visible {
    border-color: var(--accent);
  }

  .charge-polarity-switch:enabled:active,
  .charge-polarity-switch:enabled:focus-visible,
  .charge-chip-action:enabled:active,
  .charge-chip-action:enabled:focus-visible,
  .charge-draft-action:enabled:active,
  .charge-draft-action:enabled:focus-visible {
    box-shadow: var(--control-glow);
  }

  .charge-polarity-switch:disabled,
  .charge-chip-action:disabled,
  .charge-draft-action:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }

  .charge-polarity-switch:disabled:hover,
  .charge-polarity-switch:disabled:active,
  .charge-chip-action:disabled:hover,
  .charge-chip-action:disabled:active,
  .charge-draft-action:disabled:hover,
  .charge-draft-action:disabled:active {
    filter: none;
    box-shadow: none;
  }

  .charge-polarity-switch:disabled:focus,
  .charge-polarity-switch:disabled:focus-visible,
  .charge-chip-action:disabled:focus,
  .charge-chip-action:disabled:focus-visible,
  .charge-draft-action:disabled:focus,
  .charge-draft-action:disabled:focus-visible {
    box-shadow: none;
  }

  .charge-polarity-thumb {
    pointer-events: none;
    position: absolute;
    top: 50%;
    left: 3px;
    height: 1.25rem;
    width: 1.25rem;
    transform: translateY(-50%);
    border-radius: 9999px;
    background: var(--accent);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.28);
    transition: transform 200ms ease-out;
  }

  .charge-polarity-thumb-positive {
    transform: translate(22px, -50%);
  }

  .charge-polarity-mark {
    pointer-events: none;
    position: absolute;
    top: 50%;
    z-index: 1;
    display: flex;
    height: 1.25rem;
    width: 1.25rem;
    transform: translateY(-50%);
    align-items: center;
    justify-content: center;
    transition: color 200ms ease-out;
  }

  .charge-polarity-mark-negative {
    left: 3px;
  }

  .charge-polarity-mark-positive {
    left: 25px;
  }

  .charge-polarity-mark-active {
    color: var(--accent-contrast);
  }

  .charge-polarity-mark-inactive {
    color: var(--muted);
  }

  .charge-polarity-icon {
    height: 1rem;
    width: 1rem;
    flex-shrink: 0;
  }

  .charge-chip-list {
    display: flex;
    min-width: 0;
    width: max-content;
    max-width: calc(100% - 11rem);
    align-items: center;
    gap: 0.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 0;
    scrollbar-width: thin;
  }

  .charge-chip {
    display: inline-flex;
    height: 1.75rem;
    min-width: 3rem;
    flex-shrink: 0;
    align-items: stretch;
    gap: 3px;
    border: 1px solid var(--control-border);
    border-radius: 9999px;
    background: var(--surface-2);
    padding: 0 3px;
    color: var(--text);
    font-size: 0.875rem;
  }

  .charge-chip-editing {
    border-color: var(--accent);
    background-color: color-mix(in srgb, var(--accent), transparent 92%);
  }

  .charge-chip-target {
    display: flex;
    height: 100%;
    min-width: 0;
    flex: 1;
    align-items: center;
    border: none;
    border-radius: 9999px;
    background: var(--surface-2);
    padding: 0 0.5rem 0 0.625rem;
    color: inherit;
    text-align: left;
    box-shadow: none;
    appearance: none;
  }

  .charge-chip-editor {
    cursor: text;
    padding-right: 0.375rem;
  }

  .charge-chip-value {
    min-width: 0;
    color: inherit;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .charge-chip-input {
    min-width: 2ch;
    border: none;
    background: transparent;
    padding: 0;
    color: var(--text);
    font-size: 0.875rem;
    box-shadow: none;
    outline: none;
  }

  .charge-chip-action {
    display: inline-flex;
    height: 1.25rem;
    width: 1.25rem;
    flex-shrink: 0;
    align-self: center;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 9999px;
    background: var(--surface-2);
    padding: 0;
    color: var(--muted);
  }

  .charge-chip-icon {
    height: 0.875rem;
    width: 0.875rem;
    flex-shrink: 0;
  }

  .charge-draft-shell {
    display: flex;
    min-width: 11rem;
    flex: 1;
    align-items: center;
    gap: 0.375rem;
  }

  .charge-draft-input {
    min-width: 7ch;
    flex: 1;
    border: none;
    background: transparent;
    padding: 0;
    color: var(--text);
    box-shadow: none;
    outline: none;
  }

  .charge-draft-input::placeholder {
    color: var(--muted);
  }

  .charge-draft-action {
    display: inline-flex;
    height: 1.75rem;
    width: 1.75rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 9999px;
    background: var(--surface-2);
    padding: 0;
    color: var(--text);
  }

  @media (max-width: 639.98px) {
    .charge-chip-list {
      max-width: calc(100% - 9.75rem);
    }

    .charge-draft-shell {
      min-width: 9.75rem;
    }
  }
</style>
