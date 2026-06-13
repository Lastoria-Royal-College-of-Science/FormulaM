import { defineConfig, presetIcons, presetUno } from "unocss";

const noNativeOutline = "[outline:none] focus:[outline:none] focus-visible:[outline:none] active:[outline:none]";
const interactiveBorder = `hover:border-accent active:border-accent focus:border-accent focus-visible:border-accent ${noNativeOutline}`;
const blueButtonBorder = `hover:border-control-border active:border-accent focus-visible:border-accent ${noNativeOutline}`;
const disabledState = "disabled:cursor-not-allowed disabled:opacity-55";
const buttonInteraction = `${interactiveBorder} active:shadow-control-glow focus-visible:shadow-control-glow`;
const blueButtonInteraction = `${blueButtonBorder} active:shadow-control-glow focus-visible:shadow-control-glow`;
const fieldInteraction = `${interactiveBorder} focus:shadow-control-glow focus-visible:shadow-control-glow`;

export default defineConfig({
  presets: [presetUno(), presetIcons()],
  theme: {
    colors: {
      bg: "var(--bg)",
      surface: "var(--surface)",
      "surface-2": "var(--surface-2)",
      "control-bg": "var(--control-bg)",
      text: "var(--text)",
      muted: "var(--muted)",
      border: "var(--border)",
      "control-border": "var(--control-border)",
      accent: "var(--accent)",
      "accent-contrast": "var(--accent-contrast)",
      danger: "var(--danger)",
      success: "var(--success)",
      info: "var(--info)",
      focus: "var(--focus-ring)",
      row: "var(--row-odd)",
    },
    boxShadow: {
      app: "var(--shadow)",
      "control-glow": "var(--control-glow)",
    },
  },
  shortcuts: {
    "page-shell": "mx-auto w-full max-w-[1180px] px-4 py-6 pb-7 lt-md:px-2.5 lt-md:pt-3.5",
    "ui-card": "my-4.5 rounded-2 border border-solid border-border bg-surface p-5.5 shadow-app lt-md:p-4",
    "round-control": `inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-solid border-control-border bg-control-bg p-0 text-text shadow-app ${buttonInteraction}`,
    "field-title": "mb-1.5 block font-[650]",
    "field-hint": "mt-1.25 block text-muted",
    "field-control": `w-full min-h-[42px] rounded-[10px] border border-solid border-control-border bg-control-bg px-3 py-2.5 text-text ${fieldInteraction} ${disabledState}`,
    "field-select": "bg-no-repeat bg-[length:6px_6px] [background-image:linear-gradient(45deg,transparent_50%,var(--muted)_50%),linear-gradient(135deg,var(--muted)_50%,transparent_50%)] [background-position:calc(100%-18px)_50%,calc(100%-12px)_50%] pr-10",
    "help-button": `ml-1.25 inline-flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full border border-solid border-control-border bg-surface-2 p-0 text-xs text-muted ${buttonInteraction}`,
    "primary-action": `min-h-[42px] cursor-pointer rounded-2 border border-solid border-transparent bg-accent px-4 py-2.5 font-[750] text-accent-contrast ${blueButtonInteraction} ${disabledState}`,
    "secondary-action": `min-h-[42px] cursor-pointer rounded-2 border border-solid border-control-border bg-surface-2 px-4 py-2.5 text-text ${buttonInteraction} ${disabledState}`,
    "icon-action": `inline-flex h-[42px] min-h-[42px] w-11 items-center justify-center cursor-pointer rounded-2 border border-solid border-transparent bg-accent p-0 text-accent-contrast ${blueButtonInteraction} ${disabledState}`,
    "danger-icon-action": `inline-flex h-10 w-10 items-center justify-center cursor-pointer rounded-[10px] border border-solid border-control-border bg-surface-2 p-0 text-danger ${buttonInteraction} ${disabledState}`,
    "toggle-control": "inline-flex cursor-pointer select-none items-center gap-3.5 text-text",
    "toggle-control-disabled": "cursor-not-allowed opacity-70",
    "toggle-input": "sr-only",
    "toggle-track": "relative h-7 w-12 shrink-0 rounded-full border border-solid border-control-border bg-[color-mix(in_srgb,var(--surface-2),var(--surface)_20%)] transition-all duration-200 ease-out peer-checked:border-accent peer-checked:bg-[color-mix(in_srgb,var(--accent),transparent_35%)] peer-focus-visible:shadow-control-glow after:absolute after:left-[3px] after:top-[3px] after:h-5 after:w-5 after:rounded-full after:border after:border-solid after:border-[color-mix(in_srgb,var(--control-border),transparent_25%)] after:bg-surface after:shadow-[0_2px_6px_rgba(15,23,42,0.18)] after:transition-all after:duration-200 after:ease-out after:content-[''] peer-checked:after:translate-x-5 peer-checked:after:border-[color-mix(in_srgb,var(--accent),transparent_20%)] peer-checked:after:bg-accent-contrast",
    "toggle-copy": "text-[0.98rem] leading-[1.4]",
    "table-head": "px-2 py-2 text-left text-[0.9rem] text-muted",
    "table-cell": "border-t border-border [border-top-style:solid] px-2 py-2 align-middle",
    "formula-table-head": "border-b border-border [border-bottom-style:solid] px-2 py-2 text-left text-[0.9rem] text-muted",
    "formula-table-cell": "px-2 py-2 align-middle",
    "inline-code": "rounded-1.5 border border-solid border-border bg-surface-2 px-1.25 py-px",
  },
});
