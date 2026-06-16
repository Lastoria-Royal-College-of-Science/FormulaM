<script lang="ts">
  import { tick } from "svelte";
  import ToggleSwitch from "./ToggleSwitch.svelte";
  import { canCommitChargeEntryText, formatChargeEntry, formatSignedChargeText, isChargeDraftText } from "../core/chargeInput";
  import type { SearchFormState } from "../core/types";

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
          <span class={`charge-polarity-thumb ${form.chargeSign === "+" ? "charge-polarity-thumb-positive" : ""}`}></span>
          <span class={`charge-polarity-mark charge-polarity-mark-negative ${form.chargeSign === "-" ? "charge-polarity-mark-active" : "charge-polarity-mark-inactive"}`}>
            <span class="charge-polarity-icon i-mdi-minus" aria-hidden="true"></span>
          </span>
          <span class={`charge-polarity-mark charge-polarity-mark-positive ${form.chargeSign === "+" ? "charge-polarity-mark-active" : "charge-polarity-mark-inactive"}`}>
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
