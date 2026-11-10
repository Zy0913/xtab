/**
 * Turn a wallpaper's dominant colour into an accent colour.
 *
 * Dominant colours of photos are mostly pale or greyish. Used as-is, the
 * white text that sits on the accent (menu highlights, primary buttons,
 * switches) becomes unreadable. The accent keeps the wallpaper's hue, but its
 * lightness is pulled into the band the macOS accent colours live in and its
 * chroma is boosted so it reads as a colour. A near-grey wallpaper still gives
 * a near-grey accent, like Graphite.
 */

const MIN_L = 0.46
const MAX_L = 0.56
const CHROMA_GAIN = 2.5
const MAX_C = 0.19
/** Relative luminance at which white text reaches 4.6:1 (4.5 plus room for
    rounding to 8-bit channels). */
const MAX_Y = 1.05 / 4.6 - 0.05

type Vec3 = [number, number, number]

const toLinear = (v: number) => {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const toSrgb = (c: number) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, v)) * 255)
}

/** Linear sRGB → OKLCH (hue in radians). */
function linearToOklch([r, g, b]: Vec3): Vec3 {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [L, Math.hypot(A, B), Math.atan2(B, A)]
}

/** OKLCH (hue in radians) → linear sRGB, possibly out of gamut. */
function oklchToLinear([L, C, h]: Vec3): Vec3 {
  const A = C * Math.cos(h)
  const B = C * Math.sin(h)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (rgb: Vec3) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4)
const luminance = ([r, g, b]: Vec3) => 0.2126 * r + 0.7152 * g + 0.0722 * b

/** Parses `rgb(r, g, b)` / `rgb(r g b)` with 0–255 channels. */
export function parseRgb(color: string): Vec3 | null {
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(color.trim())
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

/** Relative luminance (WCAG) of an `rgb()` colour, or null if unparseable. */
export function relativeLuminance(color: string): number | null {
  const rgb = parseRgb(color)
  return rgb ? luminance(rgb.map(toLinear) as Vec3) : null
}

/** Returns `rgb(r g b)`; anything it can't parse is passed through unchanged. */
export function accentFromTint(tint: string): string {
  const rgb = parseRgb(tint)
  if (!rgb) return tint

  const [l0, c0, h] = linearToOklch(rgb.map(toLinear) as Vec3)
  let L = Math.min(MAX_L, Math.max(MIN_L, l0))
  let C = Math.min(MAX_C, c0 * CHROMA_GAIN)
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
