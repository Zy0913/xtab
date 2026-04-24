import { describe, it, expect } from 'vitest'
import { extractWallpaperTint } from './wallpaperTint'

describe('extractWallpaperTint', () => {
  it('is a function', () => {
    expect(typeof extractWallpaperTint).toBe('function')
  })
})
