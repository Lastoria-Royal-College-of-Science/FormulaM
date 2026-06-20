import type { SpectrumPeak } from "../types";

function lowerBound(peaks: readonly SpectrumPeak[], targetMz: number): number {
  let low = 0;
  let high = peaks.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (peaks[middle].mz < targetMz) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function findNearestPeak(
  peaks: readonly SpectrumPeak[],
  targetMz: number,
  xMin = Number.NEGATIVE_INFINITY,
  xMax = Number.POSITIVE_INFINITY,
): SpectrumPeak | null {
  if (!peaks.length) return null;
  const visiblePeaks = peaks.filter((peak) => peak.mz >= xMin && peak.mz <= xMax);
  if (!visiblePeaks.length) return null;

  const insertionIndex = lowerBound(visiblePeaks, targetMz);
  const left = visiblePeaks[Math.max(0, insertionIndex - 1)];
  const right = visiblePeaks[Math.min(visiblePeaks.length - 1, insertionIndex)];
  if (!left) return right ?? null;
  if (!right) return left ?? null;
  return Math.abs(left.mz - targetMz) <= Math.abs(right.mz - targetMz) ? left : right;
}
