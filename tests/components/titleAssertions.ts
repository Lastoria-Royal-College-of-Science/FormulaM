export function enabledInteractiveControlsWithTitles(markup: string): string[] {
  const controls = markup.match(/<(?:button|input|select|textarea)\b[^>]*>/g) ?? [];
  return controls.filter((tag) => tag.includes("title=") && !/\sdisabled(?:[\s=>]|$)/.test(tag));
}
