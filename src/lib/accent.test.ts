import { describe, it, expect } from 'vitest'
import { accentFromTint, parseRgb, relativeLuminance } from './accent'

const contrastWithWhite = (color: string) => 1.05 / ((relativeLuminance(color) ?? 1) + 0.05)

/** Hue angle in degrees, from the sRGB channels (HSL hue). */
function hue(color: string) {
  const [r, g, b] = parseRgb(color)!.map((v) => v / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) return 0
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

describe('accentFromTint', () => {
  it.each([
    'rgb(194, 138, 138)', // pale sunset rose
    'rgb(236, 226, 200)', // sand
    'rgb(120, 200, 230)', // light sky
    'rgb(250, 230, 60)', // yellow, bright at any lightness
    'rgb(255, 255, 255)',
  ])('keeps white text legible on %s', (tint) => {
    expect(contrastWithWhite(accentFromTint(tint))).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the hue of the wallpaper', () => {
    const accent = accentFromTint('rgb(120, 200, 230)')
    expect(Math.abs(hue(accent) - hue('rgb(120, 200, 230)'))).toBeLessThan(12)
  })

  it('lifts a near-black tint so the accent is still visible', () => {
    expect(relativeLuminance(accentFromTint('rgb(12, 14, 30)'))!).toBeGreaterThan(0.08)
  })

  it('gives a grey accent for a grey wallpaper', () => {
    const [r, g, b] = parseRgb(accentFromTint('rgb(128, 128, 128)'))!
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(2)
  })

  it('passes unknown formats through', () => {
    expect(accentFromTint('#336699')).toBe('#336699')
  })
})
