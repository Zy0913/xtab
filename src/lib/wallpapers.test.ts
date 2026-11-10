import { describe, expect, it, vi, afterEach } from 'vitest'
import { DEFAULT_WALLPAPER, PRESETS, pickFallbackWallpaper } from './wallpapers'

describe('pickFallbackWallpaper', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prefers extra urls such as favorites', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(pickFallbackWallpaper(PRESETS[0].url, [{ url: 'https://cached.example/a.jpg' }])).toBe(
      'https://cached.example/a.jpg',
    )
  })

  it('skips the current wallpaper', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const next = pickFallbackWallpaper(PRESETS[0].url)
    expect(next).not.toBe(PRESETS[0].url)
    expect(next).toBe(PRESETS[1].url)
  })

  it('can fall back to the bundled default', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const onlyCurrent = pickFallbackWallpaper(null, [])
    expect([DEFAULT_WALLPAPER, ...PRESETS.map((p) => p.url)]).toContain(onlyCurrent)
  })
})
