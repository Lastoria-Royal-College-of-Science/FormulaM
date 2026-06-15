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
  class={`toggle-switch ${checked ? "toggle-switch-checked" : ""}`}
  role="switch"
  aria-checked={checked}
  aria-label={ariaLabel}
  disabled={disabled}
  on:click={handleClick}
>
  <span class={`toggle-switch-thumb ${checked ? "toggle-switch-thumb-checked" : ""}`} aria-hidden="true"></span>
</button>
