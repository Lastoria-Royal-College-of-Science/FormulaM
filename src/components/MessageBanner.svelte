<script lang="ts">
  import type { AppStatus } from "../core/types";

  export let message = "";
  export let status: AppStatus = "idle";

  $: kind = status === "error" ? "error" : status === "success" ? "success" : status === "running" || status === "loading" ? "info" : "";
</script>

{#if message}
  <section class={`message ${kind}`.trim()} aria-live="polite">
    {message}
  </section>
{/if}
