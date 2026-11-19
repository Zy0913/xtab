/**
 * Decide whether a dropdown anchored to `anchor` should open upward to avoid
 * clipping past the bottom of the viewport.
 */
export function shouldOpenUpward(anchor: HTMLElement | null, minSpace = 220): boolean {
  if (!anchor) return false
  const rect = anchor.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom
  return below < minSpace && rect.top > below
}
