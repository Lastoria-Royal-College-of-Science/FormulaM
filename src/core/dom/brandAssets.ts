import type { ThemeName } from "../types";

export type BrandAssetKind = "favicon" | "logo";

export function brandAssetPath(kind: BrandAssetKind, theme: ThemeName): string {
  return `${import.meta.env.BASE_URL}${kind}-${theme}.svg`;
}

export function updateFavicon(theme: ThemeName): void {
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');

  if (favicon) favicon.href = brandAssetPath("favicon", theme);
}
