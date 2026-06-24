export const BUSY_DISABLED_TITLE = "Wait for the current operation to finish.";

export const DEFAULT_DISABLED_TITLE = "This control is currently unavailable.";

export function disabledTitle(isDisabled: boolean, reason: string | undefined): string | undefined {
  if (!isDisabled) return undefined;
  return reason?.trim() || DEFAULT_DISABLED_TITLE;
}
