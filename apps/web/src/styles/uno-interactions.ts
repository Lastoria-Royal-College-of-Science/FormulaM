export const noNativeOutline =
  "[outline:none] focus:[outline:none] focus-visible:[outline:none] active:[outline:none]";

export const controlRestBorder = "[--control-rest-border:var(--control-border)]";

export const transparentRestBorder = "[--control-rest-border:transparent]";

export const interactiveBorder = `enabled:hover:[border-color:var(--accent)] enabled:active:[border-color:var(--accent)] ${noNativeOutline}`;

export const fieldFocusBorder =
  "enabled:focus:[border-color:var(--accent)] enabled:focus-visible:[border-color:var(--accent)]";

export const blueButtonBorder = `enabled:hover:[border-color:var(--accent)] enabled:active:[border-color:var(--accent)] ${noNativeOutline}`;

export const primaryActionPressedState =
  "enabled:hover:bg-surface-2 enabled:hover:text-text enabled:active:bg-surface-2 enabled:active:text-text";

export const disabledState =
  "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:filter-none disabled:active:filter-none disabled:hover:shadow-none disabled:active:shadow-none";

export const focusRestBorder =
  "[&:not(:disabled):focus:not(:hover):not(:active)]:[border-color:var(--control-rest-border)] [&:not(:disabled):focus-visible:not(:hover):not(:active)]:[border-color:var(--control-rest-border)]";

export const buttonInteraction = `${controlRestBorder} ${interactiveBorder} ${focusRestBorder} enabled:active:shadow-control-glow enabled:focus-visible:shadow-control-glow disabled:shadow-none disabled:focus:shadow-none disabled:focus-visible:shadow-none`;

export const blueButtonInteraction = `${transparentRestBorder} ${blueButtonBorder} ${focusRestBorder} enabled:active:shadow-control-glow enabled:focus-visible:shadow-control-glow disabled:shadow-none disabled:focus:shadow-none disabled:focus-visible:shadow-none`;

export const fieldInteraction = `${interactiveBorder} ${fieldFocusBorder} enabled:focus:shadow-control-glow enabled:focus-visible:shadow-control-glow disabled:hover:border-control-border disabled:active:border-control-border disabled:focus:border-control-border disabled:focus-visible:border-control-border disabled:shadow-none disabled:focus:shadow-none disabled:focus-visible:shadow-none`;

export const linkControlInteraction = `${controlRestBorder} ${focusRestBorder} hover:[filter:var(--interactive-hover-filter)] hover:[border-color:var(--accent)] active:[filter:var(--interactive-active-filter)] active:[border-color:var(--accent)] active:shadow-control-glow focus-visible:shadow-control-glow ${noNativeOutline}`;
