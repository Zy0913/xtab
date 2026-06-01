/**
 * Extract dominant color from a wallpaper image for dynamic tinting.
 * Uses canvas-based color quantization with brightness-aware selection.
 */

import { warn } from '@/lib/logger'
import { readCachedBlob } from './wallpaperCache'

interface ColorResult {
  rgb: string // "rgb(r, g, b)"
  rgba: string // "rgba(r, g, b, a)"
  hex: string // "#RRGGBB"
  isDark: boolean // whether the color is dark (for contrast decisions)
  luminance: number // relative luminance 0..1 (WCAG)
}

const SAMPLE_SIZE = 64 // Downsample to 64x64 for performance
const CACHE = new Map<string, ColorResult>()
const PENDING = new Map<string, Promise<ColorResult | null>>()

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

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function clampColorLuminance(r: number, g: number, b: number): [number, number, number] {
  const [h, s, l] = rgbToHsl(r, g, b)
  const clampedL = Math.max(0.35, Math.min(0.65, l))
  return hslToRgb(h, s, clampedL)
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function quantizeColor(r: number, g: number, b: number, steps: number): [number, number, number] {
  // Reduce color space to find dominant clusters
  const quantize = (v: number) =>
    Math.round((v / 255) * (steps - 1)) * Math.round(255 / (steps - 1))
  return [quantize(r), quantize(g), quantize(b)]
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
          const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
          const pixels = imageData.data

          // Count color clusters
          const clusters = new Map<
            string,
            { r: number; g: number; b: number; count: number; lum: number }
          >()

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const a = pixels[i + 3]

            if (a < 128) continue // Skip transparent

            const [qr, qg, qb] = quantizeColor(r, g, b, 8)
            const key = `${qr},${qg},${qb}`
            const lum = getLuminance(qr, qg, qb)

            if (clusters.has(key)) {
              const c = clusters.get(key)!
              c.count++
              // Weight by saturation (avoid gray)
              const max = Math.max(qr, qg, qb)
              const min = Math.min(qr, qg, qb)
              const sat = max === 0 ? 0 : (max - min) / max
              if (sat > 0.15) c.count += 2 // Boost colorful pixels
            } else {
              clusters.set(key, { r: qr, g: qg, b: qb, count: 1, lum })
            }
          }

          // Calculate weighted average luminance across all clusters — this better
          // represents the overall brightness of the wallpaper than the dominant
          // cluster alone (which the preference function skews toward mid-tones).
          let totalWeight = 0
          let weightedLum = 0
          for (const c of clusters.values()) {
            totalWeight += c.count
            weightedLum += c.lum * c.count
          }
          const avgLuminance = totalWeight > 0 ? weightedLum / totalWeight : 0.5

          // Pick the most frequent cluster for the tint color (accent).
          let best: { r: number; g: number; b: number; count: number; lum: number } | null = null
          for (const c of clusters.values()) {
            // Prefer colors that aren't too dark or too bright
            const preference = c.count * (1 - Math.abs(c.lum - 0.45) * 0.8)
            if (!best || preference > best.count * (1 - Math.abs(best.lum - 0.45) * 0.8)) {
              best = c
            }
          }

          if (!best) {
            done(null)
            return
          }

          const [clampedR, clampedG, clampedB] = clampColorLuminance(best.r, best.g, best.b)

          const result: ColorResult = {
            rgb: `rgb(${clampedR}, ${clampedG}, ${clampedB})`,
            rgba: `rgba(${clampedR}, ${clampedG}, ${clampedB}, 0.85)`,
            hex: rgbToHex(clampedR, clampedG, clampedB),
            isDark: avgLuminance < 0.4,
            luminance: avgLuminance,
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
