import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const readLocalWallpaper = vi.fn()

vi.mock('./localWallpaper', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./localWallpaper')>()),
  readLocalWallpaper: (key: string) => readLocalWallpaper(key),
}))

import { resolveWallpaper, warmWallpaperCache, wallpaperSource } from './wallpaperCache'
import { DEFAULT_WALLPAPER } from './wallpapers'

describe('uploaded wallpapers', () => {
  const upload = new Blob(['picture'], { type: 'image/png' })

  beforeEach(() => {
    readLocalWallpaper.mockReset()
    vi.stubGlobal('fetch', vi.fn())
    Object.assign(URL, { createObjectURL: () => 'blob:upload' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('are shown from their own bytes', async () => {
    readLocalWallpaper.mockResolvedValue(upload)
    expect(await resolveWallpaper('local:m3x1k2-abc123')).toEqual({
      objectUrl: 'blob:upload',
      fromCache: true,
    })
    expect(readLocalWallpaper).toHaveBeenCalledWith('local:m3x1k2-abc123')
  })

  it('give the default wallpaper when this browser does not hold them', async () => {
    readLocalWallpaper.mockResolvedValue(null)
    expect(await wallpaperSource('local:m3x1k2-abc123')).toBe(DEFAULT_WALLPAPER)
    expect(await resolveWallpaper('local:m3x1k2-abc123')).toEqual({
      objectUrl: DEFAULT_WALLPAPER,
      fromCache: false,
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('are never downloaded', async () => {
    await warmWallpaperCache('local:m3x1k2-abc123')
    expect(fetch).not.toHaveBeenCalled()
  })
})
