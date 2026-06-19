<script lang="ts">
  export let checked = false;
  export let disabled = false;
  export let ariaLabel: string;
  export let onChange: (value: boolean) => void;

  function handleClick(): void {
    if (!disabled) onChange(!checked);
  }
</script>

<button
  type="button"
  class="toggle-switch"
  class:toggle-switch-checked={checked}
  role="switch"
  aria-checked={checked}
  aria-label={ariaLabel}
  disabled={disabled}
  on:click={handleClick}
>
  <span class="toggle-switch-thumb" class:toggle-switch-thumb-checked={checked} aria-hidden="true"></span>
</button>

<style>
  .toggle-switch {
    position: relative;
    display: inline-flex;
    height: 1.75rem;
    width: 3rem;
    flex-shrink: 0;
    align-items: center;
    overflow: hidden;
    border: 1px solid var(--toggle-track-border);
    border-radius: 9999px;
    background: var(--toggle-track-bg);
    padding: 0;
    color: var(--text);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
    outline: none;
  }

  .toggle-switch:focus,
  .toggle-switch:focus-visible,
  .toggle-switch:active {
    outline: none;
  }

  .toggle-switch:enabled:active,
  .toggle-switch:enabled:focus,
  .toggle-switch:enabled:focus-visible {
    border-color: var(--accent);
  }

  .toggle-switch:enabled:active,
  .toggle-switch:enabled:focus-visible {
    box-shadow: var(--control-glow);
  }

  .toggle-switch:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }

  .toggle-switch:disabled:hover,
  .toggle-switch:disabled:active {
    filter: none;
    box-shadow: none;
  }

  .toggle-switch:disabled:focus,
  .toggle-switch:disabled:focus-visible {
    box-shadow: none;
  }

  .toggle-switch-checked {
    border-color: var(--toggle-track-active-border);
    background: var(--toggle-track-active);
  }

  .toggle-switch-thumb {
    pointer-events: none;
    position: absolute;
    top: 50%;
    left: 3px;
    height: 1.25rem;
    width: 1.25rem;
    transform: translateY(-50%);
    border: 1px solid var(--toggle-thumb-border);
    border-radius: 9999px;
    background: var(--toggle-thumb-bg);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.28);
    transition: all 200ms ease-out;
  }

  .toggle-switch-thumb-checked {
    transform: translate(22px, -50%);
    border-color: var(--toggle-thumb-active-border);
    background: var(--toggle-thumb-active-bg);
  }
</style>
