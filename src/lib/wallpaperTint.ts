/**
 * Extract dominant color from a wallpaper image for dynamic tinting.
 * Uses canvas-based color quantization with brightness-aware selection.
 */

import { warn } from '@/lib/logger'

interface ColorResult {
  rgb: string      // "rgb(r, g, b)"
  rgba: string     // "rgba(r, g, b, a)"
  hex: string      // "#RRGGBB"
  isDark: boolean  // whether the color is dark (for contrast decisions)
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

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function quantizeColor(r: number, g: number, b: number, steps: number): [number, number, number] {
  // Reduce color space to find dominant clusters
  const quantize = (v: number) => Math.round((v / 255) * (steps - 1)) * Math.round(255 / (steps - 1))
  return [quantize(r), quantize(g), quantize(b)]
}

export function extractWallpaperTint(url: string): Promise<ColorResult | null> {
  if (CACHE.has(url)) {
    return Promise.resolve(CACHE.get(url)!)
  }

  // Deduplicate in-flight requests for the same URL
  const existing = PENDING.get(url)
  if (existing) return existing

  const promise = new Promise<ColorResult | null>((resolve) => {
    const done = (value: ColorResult | null) => {
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
        const clusters = new Map<string, { r: number; g: number; b: number; count: number; lum: number }>()

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

        const result: ColorResult = {
          rgb: `rgb(${best.r}, ${best.g}, ${best.b})`,
          rgba: `rgba(${best.r}, ${best.g}, ${best.b}, 0.85)`,
          hex: rgbToHex(best.r, best.g, best.b),
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
    img.src = url
  })

  PENDING.set(url, promise)
  return promise
}
