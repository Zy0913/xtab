/**
 * Turn a wallpaper's tint into an accent colour.
 *
 * The accent keeps the wallpaper's hue but stays soft: a little more colour
 * than the tint, never vivid, so it sits quietly on fresh, pastel pictures
 * as well as on deep ones. A near-grey wallpaper gives a near-grey accent,
 * like Graphite. Yellow-greens lean toward leaf green, because at this
 * lightness they would look olive.
 *
 * White text sits on the accent (menu highlights, primary buttons, pressed
 * toolbar buttons), so it can't get as light as the tint itself. Lightness
 * stays in a narrow band and comes down where white text would fall below
 * 4.5:1.
 */

import {
  inGamut,
  linearToOklch,
  luminance,
  oklchToLinear,
  parseRgb,
  toLinear,
  toSrgb,
} from './color'
import type { Vec3 } from './color'

export { parseRgb, relativeLuminance } from './color'

const MIN_L = 0.52
const MAX_L = 0.6
const CHROMA_GAIN = 1.4
/** OKLCH chroma ceiling: a muted, dusty colour at this lightness. */
export const MAX_ACCENT_CHROMA = 0.09
/** Relative luminance at which white text reaches 4.6:1 (4.5 plus room for
    rounding to 8-bit channels). */
const MAX_Y = 1.05 / 4.6 - 0.05

/** Yellow-greens (foliage in sunlight) turn olive at accent lightness. The
    middle of that band, its half-width and how far its middle turns toward
    leaf green, in degrees. */
const OLIVE_HUE = 112
const OLIVE_SPAN = 34
const OLIVE_TURN = 20

/** Turns yellow-green hues (radians) toward leaf green. The turn is smooth
    and keeps hues in order, so neighbouring wallpapers stay neighbours. */
function awayFromOlive(h: number): number {
  // Signed distance from the middle of the band; h comes from atan2 (±π).
  let d = (h * 180) / Math.PI - OLIVE_HUE
  if (d < -180) d += 360
  if (Math.abs(d) >= OLIVE_SPAN) return h
  const turn = OLIVE_TURN * 0.5 * (1 + Math.cos((Math.PI * d) / OLIVE_SPAN))
  return h + (turn * Math.PI) / 180
}

/** Returns `rgb(r g b)`; anything it can't parse is passed through unchanged. */
export function accentFromTint(tint: string): string {
  const rgb = parseRgb(tint)
  if (!rgb) return tint

  const [l0, c0, h0] = linearToOklch(rgb.map(toLinear) as Vec3)
  const h = awayFromOlive(h0)
  let L = Math.min(MAX_L, Math.max(MIN_L, l0))
  let C = Math.min(MAX_ACCENT_CHROMA, c0 * CHROMA_GAIN)
  let out = oklchToLinear([L, C, h])

  // Keep the hue and lightness; give up chroma until the colour fits sRGB.
  while (!inGamut(out) && C > 0.001) {
    C *= 0.94
    out = oklchToLinear([L, C, h])
  }
  // Hues differ in luminance at equal lightness; darken until white text
  // reaches 4.5:1.
  while (luminance(out) > MAX_Y && L > 0.3) {
    L -= 0.01
    out = oklchToLinear([L, C, h])
  }

  const [r, g, b] = out.map(toSrgb)
  return `rgb(${r} ${g} ${b})`
}
