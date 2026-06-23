export const noNativeOutline =
  "[outline:none] focus:[outline:none] focus-visible:[outline:none] active:[outline:none]";

export const interactiveBorder = `enabled:hover:[border-color:var(--accent)] enabled:active:[border-color:var(--accent)] enabled:focus:[border-color:var(--accent)] enabled:focus-visible:[border-color:var(--accent)] ${noNativeOutline}`;

export const blueButtonBorder = `enabled:hover:[border-color:var(--accent)] enabled:active:[border-color:var(--accent)] enabled:focus-visible:[border-color:var(--accent)] ${noNativeOutline}`;

export const disabledState =
  "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:filter-none disabled:active:filter-none disabled:hover:shadow-none disabled:active:shadow-none";

export const buttonInteraction = `${interactiveBorder} enabled:active:shadow-control-glow enabled:focus-visible:shadow-control-glow disabled:shadow-none disabled:focus:shadow-none disabled:focus-visible:shadow-none`;

export const blueButtonInteraction = `${blueButtonBorder} enabled:active:shadow-control-glow enabled:focus-visible:shadow-control-glow disabled:shadow-none disabled:focus:shadow-none disabled:focus-visible:shadow-none`;

export const fieldInteraction = `${interactiveBorder} enabled:focus:shadow-control-glow enabled:focus-visible:shadow-control-glow disabled:hover:border-control-border disabled:active:border-control-border disabled:focus:border-control-border disabled:focus-visible:border-control-border disabled:shadow-none disabled:focus:shadow-none disabled:focus-visible:shadow-none`;

export const linkControlInteraction = `hover:[filter:var(--interactive-hover-filter)] hover:[border-color:var(--accent)] active:[filter:var(--interactive-active-filter)] active:[border-color:var(--accent)] focus:[border-color:var(--accent)] focus-visible:[border-color:var(--accent)] active:shadow-control-glow focus-visible:shadow-control-glow ${noNativeOutline}`;
