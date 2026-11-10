import { describe, it, expect } from 'vitest'
import { averageLuminance, dominantColor, extractWallpaperTint } from './wallpaperTint'
import { oklchOf } from './color'

type Rgb = [number, number, number]

/** Opaque RGBA pixel data: each colour repeated `count` times. */
function picture(...parts: Array<[Rgb, number]>) {
  const data: number[] = []
  for (const [[r, g, b], count] of parts) {
    for (let i = 0; i < count; i++) data.push(r, g, b, 255)
  }
  return new Uint8ClampedArray(data)
}

const css = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`
const chroma = (c: Rgb) => oklchOf(css(c))![1]
const hue = (c: Rgb) => ((oklchOf(css(c))![2] * 180) / Math.PI + 360) % 360
const spread = (c: Rgb) => Math.max(...c) - Math.min(...c)

describe('dominantColor', () => {
  it('follows the foliage, not the blue cast in the shadows', () => {
    const tint = dominantColor(picture([[12, 16, 34], 700], [[62, 110, 48], 300]))!
    expect(hue(tint)).toBeGreaterThan(125)
    expect(hue(tint)).toBeLessThan(150)
  })

  it('goes with the hue that covers the most of the picture', () => {
    // A wide pastel sky and a small vivid kite.
    const tint = dominantColor(picture([[190, 215, 235], 800], [[220, 40, 40], 200]))!
    expect(hue(tint)).toBeGreaterThan(220)
    expect(hue(tint)).toBeLessThan(260)
  })

  it('is never more colourful than the picture', () => {
    const mint: Rgb = [200, 228, 212]
    expect(chroma(dominantColor(picture([mint, 1000]))!)).toBeLessThanOrEqual(chroma(mint) + 0.002)

    // A sea of slightly different blues averages to a blue no bolder than its boldest.
    const sea: Rgb[] = [
      [70, 150, 190],
      [60, 140, 200],
      [90, 160, 185],
    ]
    const tint = dominantColor(picture(...sea.map((c): [Rgb, number] => [c, 300])))!
    expect(chroma(tint)).toBeLessThanOrEqual(Math.max(...sea.map(chroma)))
  })

  it('gives grey for a grey picture', () => {
    expect(spread(dominantColor(picture([[128, 128, 128], 600], [[200, 200, 200], 400]))!)).toBe(0)
  })

  it('ignores the colour cast of near-black shadows', () => {
    expect(spread(dominantColor(picture([[5, 5, 40], 600], [[128, 128, 128], 400]))!)).toBe(0)
  })

  it('fades toward grey when only a speck of the picture is coloured', () => {
    const tint = dominantColor(picture([[128, 128, 128], 990], [[220, 40, 40], 10]))!
    expect(chroma(tint)).toBeLessThan(0.02)
  })

  it('returns null when every pixel is transparent', () => {
    expect(dominantColor(new Uint8ClampedArray(16))).toBeNull()
  })
})

describe('averageLuminance', () => {
  // The ink thresholds in theme.ts are tuned to this exact measure.
  it('measures colours quantised to 8 levels per channel', () => {
    expect(averageLuminance(picture([[0, 0, 0], 10]))).toBe(0)
    expect(averageLuminance(picture([[255, 255, 255], 10]))).toBeCloseTo(0.97345, 4)
  })

  it('counts colourful pixels three times', () => {
    // Grey quantises to 144 (0.27889), red to 252/0/0 (0.20696): the first red
    // pixel counts once and the other nine three times each.
    const lum = averageLuminance(picture([[128, 128, 128], 10], [[255, 0, 0], 10]))
    expect(lum).toBeCloseTo((0.27889 * 10 + 0.20696 * 28) / 38, 4)
  })

  it('skips transparent pixels', () => {
    const data = picture([[255, 255, 255], 4], [[0, 0, 0], 4])
    for (let i = 16; i < data.length; i += 4) data[i + 3] = 0
    expect(averageLuminance(data)).toBeCloseTo(0.97345, 4)
  })
})

describe('extractWallpaperTint', () => {
  it('is a function', () => {
    expect(typeof extractWallpaperTint).toBe('function')
  })

  it('returns a promise', () => {
    const result = extractWallpaperTint('https://example.com/img.jpg')
    expect(result).toBeInstanceOf(Promise)
  })

  it('returns the same promise when called twice with the same URL', () => {
    // The module-level CACHE map ensures synchronous lookup returns the
    // in-flight promise for duplicate calls.
    const p1 = extractWallpaperTint('https://example.com/dup.png')
    const p2 = extractWallpaperTint('https://example.com/dup.png')
    // Both must return the same in-flight promise
    expect(p1).toBe(p2)
  })

  it('returns different promises for different URLs', () => {
    const p1 = extractWallpaperTint('https://a.com/a.png')
    const p2 = extractWallpaperTint('https://a.com/b.png')
    expect(p1).not.toBe(p2)
  })
})
