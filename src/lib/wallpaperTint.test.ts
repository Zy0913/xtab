import { describe, it, expect } from 'vitest'
import { extractWallpaperTint } from './wallpaperTint'

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
