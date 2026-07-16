export function selectElementContents(element: HTMLElement): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (typeof document.createRange !== "function") return;

  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}
