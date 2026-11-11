import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Shared mutable state for the store mock
const storeState = { wallpaper: null as string | null }

vi.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: Object.assign(
    (selector?: (s: typeof storeState) => unknown) =>
      selector ? selector(storeState) : storeState,
    {
      getState: () => storeState,
      setState: (patch: Partial<typeof storeState>) => Object.assign(storeState, patch),
    },
  ),
}))

// Mock wallpaperCache
const resolveWallpaperMock = vi.fn(async (url: string) => ({
  objectUrl: `blob:mock-${url}`,
  fromCache: false,
}))
const evictOthersMock = vi.fn()

vi.mock('./wallpaperCache', () => ({
  resolveWallpaper: (...args: unknown[]) => resolveWallpaperMock(...(args as [string])),
  evictOthers: (...args: unknown[]) => evictOthersMock(...(args as [string])),
}))

// Mock the uploads store
const pruneMock = vi.fn()
const saveLocalWallpaperMock = vi.fn()

vi.mock('./localWallpaper', () => ({
  pruneLocalWallpapers: (...args: unknown[]) => pruneMock(...args),
  saveLocalWallpaper: (...args: unknown[]) => saveLocalWallpaperMock(...args),
  dataUrlToBlob: (url: string) => new Blob([url]),
}))

// Mock Image constructor
let imageBehavior: 'load' | 'error' = 'load'

vi.stubGlobal(
  'Image',
  class MockImage {
    src = ''
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    naturalWidth = 100
    naturalHeight = 100

    constructor() {
      queueMicrotask(() => {
        if (imageBehavior === 'load') this.onload?.()
        else this.onerror?.()
      })
    }
  },
)

// Mock requestAnimationFrame to resolve synchronously via setTimeout
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  return setTimeout(() => cb(Date.now()), 0)
})
vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))

// Track URL lifecycle
const createdUrls: string[] = []
const revokedUrls: string[] = []
const originalURL = globalThis.URL

vi.stubGlobal('URL', {
  ...originalURL,
  createObjectURL: () => {
    const url = `blob:obj-${createdUrls.length}`
    createdUrls.push(url)
    return url
  },
  revokeObjectURL: (url: string) => {
    revokedUrls.push(url)
  },
})

// Now import after mocks
import { useWallpaper } from './useWallpaper'

describe('useWallpaper', () => {
  beforeEach(() => {
    storeState.wallpaper = null
    createdUrls.length = 0
    revokedUrls.length = 0
    imageBehavior = 'load'
    resolveWallpaperMock.mockClear()
    evictOthersMock.mockClear()
    pruneMock.mockClear()
    saveLocalWallpaperMock.mockReset()
  })

  it('enters visible state when no wallpaper is set', () => {
    const { result } = renderHook(() => useWallpaper())
    // When wallpaper is null, the effect sets visible=true (no fade needed)
    expect(result.current.loadedUrl).toBeNull()
    expect(result.current.visible).toBe(true)
  })

  it('loads wallpaper and becomes visible', async () => {
    const { result, rerender } = renderHook(() => useWallpaper())

    await act(async () => {
      storeState.wallpaper = 'https://example.com/wall.jpg'
      rerender()
    })

    // Flush microtask (Image onload) + setTimeout (rAF mock)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })

    expect(result.current.loadedUrl).not.toBeNull()
    expect(result.current.visible).toBe(true)
    expect(resolveWallpaperMock).toHaveBeenCalledWith('https://example.com/wall.jpg')

    // Cache eviction is deferred so the active frame isn't interrupted.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2_100))
    })
    expect(evictOthersMock).toHaveBeenCalledWith('https://example.com/wall.jpg')
    // Uploads no longer in use go too.
    expect(pruneMock).toHaveBeenCalledWith('https://example.com/wall.jpg')
    expect(saveLocalWallpaperMock).not.toHaveBeenCalled()
  })

  it('moves an upload kept in the settings by an older version to the uploads store', async () => {
    saveLocalWallpaperMock.mockResolvedValue('local:m3x1k2-abc123')
    const { rerender } = renderHook(() => useWallpaper())

    await act(async () => {
      storeState.wallpaper = 'data:image/png;base64,AAAA'
      rerender()
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2_100))
    })

    expect(saveLocalWallpaperMock).toHaveBeenCalledWith(expect.any(Blob))
    expect(storeState.wallpaper).toBe('local:m3x1k2-abc123')
  })

  it('leaves a wallpaper chosen while the old upload was moving', async () => {
    saveLocalWallpaperMock.mockImplementation(async () => {
      storeState.wallpaper = 'https://example.com/chosen.jpg'
      return 'local:m3x1k2-abc123'
    })
    const { rerender } = renderHook(() => useWallpaper())

    await act(async () => {
      storeState.wallpaper = 'data:image/png;base64,AAAA'
      rerender()
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2_100))
    })

    expect(storeState.wallpaper).toBe('https://example.com/chosen.jpg')
  })

  it('falls back gracefully on image error', async () => {
    imageBehavior = 'error'
    const { result, rerender } = renderHook(() => useWallpaper())

    await act(async () => {
      storeState.wallpaper = 'https://example.com/broken.jpg'
      rerender()
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    // Keep prior frame; no successful load so loadedUrl stays null
    expect(result.current.visible).toBe(true)
    expect(result.current.loadedUrl).toBeNull()
  })

  it('cross-fades: sets prevUrl when wallpaper changes', async () => {
    const { result, rerender } = renderHook(() => useWallpaper())

    // Load first wallpaper
    await act(async () => {
      storeState.wallpaper = 'https://example.com/w1.jpg'
      rerender()
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })
    const firstUrl = result.current.loadedUrl
    expect(firstUrl).not.toBeNull()

    // Switch to second wallpaper
    await act(async () => {
      storeState.wallpaper = 'https://example.com/w2.jpg'
      rerender()
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    // prevUrl should hold the first URL for cross-fade
    expect(result.current.prevUrl).toBe(firstUrl)
    expect(result.current.loadedUrl).not.toBeNull()
    expect(result.current.loadedUrl).not.toBe(firstUrl)
    expect(result.current.visible).toBe(true)
  })

  it('clears wallpaper and moves loadedUrl to prevUrl', async () => {
    const { result, rerender } = renderHook(() => useWallpaper())

    await act(async () => {
      storeState.wallpaper = 'https://example.com/w.jpg'
      rerender()
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })
    const loadedUrl = result.current.loadedUrl

    await act(async () => {
      storeState.wallpaper = null
      rerender()
    })

    expect(result.current.loadedUrl).toBeNull()
    expect(result.current.prevUrl).toBe(loadedUrl)
  })

  it('cancels pending load on rapid wallpaper change', async () => {
    const { rerender } = renderHook(() => useWallpaper())

    // Trigger first load
    await act(async () => {
      storeState.wallpaper = 'https://example.com/w1.jpg'
      rerender()
    })

    // Immediately change before load completes
    await act(async () => {
      storeState.wallpaper = 'https://example.com/w2.jpg'
      rerender()
    })

    // Should not crash
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })
  })
})
