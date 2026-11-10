/**
 * Read a wallpaper's colour (for the accent) and brightness (for the ink).
 *
 * The picture is drawn into a 64×64 canvas. Its average luminance decides
 * whether the dashboard ink is light or dark. Its tint is the hue family that
 * covers the most of the picture, at the colourfulness the picture really
 * has: a pastel picture gives a pastel tint and a grey one gives grey.
 */

import { warn } from '@/lib/logger'
import { inGamut, linearToOklch, oklchToLinear, toLinear, toSrgb } from './color'
import type { Vec3 } from './color'
import { readCachedBlob } from './wallpaperCache'

interface ColorResult {
  rgb: string // "rgb(r, g, b)"
  rgba: string // "rgba(r, g, b, a)"
  hex: string // "#RRGGBB"
  isDark: boolean // whether the wallpaper is dark (for contrast decisions)
  luminance: number // average relative luminance 0..1 (WCAG)
}

const SAMPLE_SIZE = 64 // Downsample to 64x64 for performance
const CACHE = new Map<string, ColorResult>()
const PENDING = new Map<string, Promise<ColorResult | null>>()

const HUE_BINS = 24
/** Share of the picture that has to be coloured for a full-strength tint;
    greyer pictures give a proportionally greyer one. */
const FULL_COLOUR_SHARE = 0.25

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** How far a pixel's hue can be trusted, by OKLCH lightness. Shadows mostly
    carry noise and white-balance casts; near-white highlights carry glare. */
const hueTrust = (L: number) => clamp01((L - 0.15) / 0.2) * clamp01((0.99 - L) / 0.06)

/** How coloured a pixel is, 0 (grey) → 1, by OKLCH chroma. */
const colourfulness = (C: number) => clamp01((C - 0.015) / 0.015)

/**
 * The wallpaper's tint as sRGB channels, from RGBA pixel data; null when
 * every pixel is transparent.
 *
 * Every coloured pixel votes for its hue, and the tint is the average colour
 * of the 45°-wide hue family with the most votes. Being an average, it is
 * never more colourful than the pixels behind it.
 */
export function dominantColor(pixels: Uint8ClampedArray): Vec3 | null {
  const votes = new Float64Array(HUE_BINS)
  const sumL = new Float64Array(HUE_BINS)
  const sumA = new Float64Array(HUE_BINS)
  const sumB = new Float64Array(HUE_BINS)
  let opaque = 0
  let lightness = 0
  let trusted = 0
  let coloured = 0

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue
    const [L, C, h] = linearToOklch([
      toLinear(pixels[i]),
      toLinear(pixels[i + 1]),
      toLinear(pixels[i + 2]),
    ])
    opaque++
    lightness += L
    const trust = hueTrust(L)
    trusted += trust
    const vote = trust * colourfulness(C)
    if (vote === 0) continue
    coloured += vote
    const bin = Math.floor((h / (2 * Math.PI) + 1) * HUE_BINS) % HUE_BINS
    votes[bin] += vote
    sumL[bin] += vote * L
    sumA[bin] += vote * C * Math.cos(h)
    sumB[bin] += vote * C * Math.sin(h)
  }
  if (opaque === 0) return null

  // A picture with no colour to speak of gives grey at its average lightness.
  let L = lightness / opaque
  let C = 0
  let h = 0
  if (coloured > 0) {
    const wrap = (i: number) => (i + HUE_BINS) % HUE_BINS
    let peak = 0
    let peakVotes = 0
    for (let i = 0; i < HUE_BINS; i++) {
      const v = votes[wrap(i - 1)] + votes[i] + votes[wrap(i + 1)]
      if (v > peakVotes) {
        peak = i
        peakVotes = v
      }
    }
    const family = [wrap(peak - 1), peak, wrap(peak + 1)]
    const mean = (sums: Float64Array) => family.reduce((s, k) => s + sums[k], 0) / peakVotes
    const a = mean(sumA)
    const b = mean(sumB)
    L = mean(sumL)
    C = Math.hypot(a, b) * clamp01(coloured / trusted / FULL_COLOUR_SHARE)
    h = Math.atan2(b, a)
  }

  let out = oklchToLinear([L, C, h])
  while (!inGamut(out) && C > 0.001) {
    C *= 0.94
    out = oklchToLinear([L, C, h])
  }
  return out.map(toSrgb) as Vec3
}

function getLuminance(r: number, g: number, b: number): number {
  // Relative luminance per WCAG
  const rs = r / 255
  const gs = g / 255
  const bs = b / 255
  const R = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4)
  const G = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4)
  const B = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function quantizeColor(r: number, g: number, b: number, steps: number): [number, number, number] {
  // Reduce color space to find dominant clusters
  const quantize = (v: number) =>
    Math.round((v / 255) * (steps - 1)) * Math.round(255 / (steps - 1))
  return [quantize(r), quantize(g), quantize(b)]
}

/**
 * Average relative luminance of RGBA pixel data, measured on colours
 * quantised to 8 levels per channel, with colourful pixels counting three
 * times. The ink thresholds in theme.ts are tuned to this measure.
 */
export function averageLuminance(pixels: Uint8ClampedArray): number {
  const clusters = new Map<string, { count: number; lum: number }>()
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue // Skip transparent
    const [qr, qg, qb] = quantizeColor(pixels[i], pixels[i + 1], pixels[i + 2], 8)
    const key = `${qr},${qg},${qb}`
    const cluster = clusters.get(key)
    if (cluster) {
      cluster.count++
      const max = Math.max(qr, qg, qb)
      const min = Math.min(qr, qg, qb)
      const sat = max === 0 ? 0 : (max - min) / max
      if (sat > 0.15) cluster.count += 2
    } else {
      clusters.set(key, { count: 1, lum: getLuminance(qr, qg, qb) })
    }
  }

  let totalWeight = 0
  let weightedLum = 0
  for (const c of clusters.values()) {
    totalWeight += c.count
    weightedLum += c.lum * c.count
  }
  return totalWeight > 0 ? weightedLum / totalWeight : 0.5
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function extractWallpaperTint(url: string): Promise<ColorResult | null> {
  if (CACHE.has(url)) {
    return Promise.resolve(CACHE.get(url)!)
  }

  // Deduplicate in-flight requests for the same URL
  const existing = PENDING.get(url)
  if (existing) return existing

  const promise = (async () => {
    // Check IndexedDB cache first
    const cachedBlob = await readCachedBlob(url)
    const objectUrl = cachedBlob ? URL.createObjectURL(cachedBlob) : url

    return new Promise<ColorResult | null>((resolve) => {
      const done = (value: ColorResult | null) => {
        if (objectUrl.startsWith('blob:')) {
          URL.revokeObjectURL(objectUrl)
        }
        PENDING.delete(url)
        resolve(value)
      }
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = SAMPLE_SIZE
          canvas.height = SAMPLE_SIZE
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (!ctx) {
            done(null)
            return
          }

          ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
          const pixels = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data
          const tint = dominantColor(pixels)
          if (!tint) {
            done(null)
            return
          }

          const [r, g, b] = tint
          const luminance = averageLuminance(pixels)
          const result: ColorResult = {
            rgb: `rgb(${r}, ${g}, ${b})`,
            rgba: `rgba(${r}, ${g}, ${b}, 0.85)`,
            hex: rgbToHex(r, g, b),
            isDark: luminance < 0.4,
            luminance,
          }

          CACHE.set(url, result)
          done(result)
        } catch (e) {
          warn('Tint extraction failed:', e)
          done(null)
        }
      }

      img.onerror = () => done(null)

      // Handle data URLs and regular URLs
      img.src = objectUrl
    })
  })()

  PENDING.set(url, promise)
  return promise
}
