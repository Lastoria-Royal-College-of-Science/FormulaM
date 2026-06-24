export function disabledTitle(isDisabled: boolean, reason: string | undefined): string | undefined {
  if (!isDisabled) return undefined;
  return reason?.trim() || undefined;
}
