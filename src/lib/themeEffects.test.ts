import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { useSettingsStore as SettingsStore } from '@/store/useSettingsStore'

type Tint = { rgb: string; luminance: number } | null

/** Each read of a wallpaper's colours waits here until the test answers it. */
const reads = vi.hoisted(() => new Map<string, (tint: Tint) => void>())

vi.mock('@/lib/wallpaperTint', () => ({
  extractWallpaperTint: (url: string) => new Promise<Tint>((resolve) => reads.set(url, resolve)),
}))

const LAKE = '/wallpapers/default.jpg'
const BEACH = 'https://images.example/beach.jpg'
const FOREST = 'https://images.example/forest.jpg'

let store: typeof SettingsStore

/** A new tab opening on these settings, as saved. */
async function openTab(saved: {
  wallpaper: string
  wallpaperTint: string | null
  wallpaperLuminance: number | null
}) {
  vi.resetModules()
  ;({ useSettingsStore: store } = await import('@/store/useSettingsStore'))
  store.setState(saved)
  const { initTheme } = await import('./themeEffects')
  void initTheme()
}

/** Picks a wallpaper, and waits out the pause before its colours are read. */
function pick(url: string) {
  store.getState().setWallpaper(url)
  vi.advanceTimersByTime(150)
}

/** The read of a wallpaper's colours comes back. */
async function answer(url: string, rgb: string, luminance: number) {
  expect(reads.has(url), `the colours of ${url} were never read`).toBe(true)
  reads.get(url)!({ rgb, luminance })
  await vi.advanceTimersByTimeAsync(0)
}

const colours = () => {
  const { wallpaper, wallpaperTint, wallpaperLuminance } = store.getState()
  return { wallpaper, wallpaperTint, wallpaperLuminance }
}

describe('wallpaper colours', () => {
  beforeEach(() => {
    reads.clear()
    vi.useFakeTimers()
    vi.stubGlobal('matchMedia', (media: string) => ({
      media,
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('are those of the wallpaper picked last, when an earlier pick is read later', async () => {
    await openTab({ wallpaper: FOREST, wallpaperTint: 'rgb(60, 80, 50)', wallpaperLuminance: 0.12 })
    pick(BEACH)
    pick(LAKE)
    await answer(LAKE, 'rgb(164, 161, 189)', 0.48)
    await answer(BEACH, 'rgb(212, 183, 167)', 0.46)
    expect(colours()).toEqual({
      wallpaper: LAKE,
      wallpaperTint: 'rgb(164, 161, 189)',
      wallpaperLuminance: 0.48,
    })
  })

  it('are read for a wallpaper picked while the first read of a new tab is still out', async () => {
    await openTab({ wallpaper: LAKE, wallpaperTint: null, wallpaperLuminance: null })
    pick(FOREST)
    await answer(FOREST, 'rgb(60, 80, 50)', 0.12)
    await answer(LAKE, 'rgb(164, 161, 189)', 0.48)
    expect(colours()).toEqual({
      wallpaper: FOREST,
      wallpaperTint: 'rgb(60, 80, 50)',
      wallpaperLuminance: 0.12,
    })
  })
})
