import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { WallhavenResult } from '@/lib/wallhaven'

// ---------------------------------------------------------------------------
// Mock state objects (mutable so we can simulate store changes between renders)
// ---------------------------------------------------------------------------

const storeState = {
  wallpaper: null as string | null,
  wallpaperDimming: 0,
  setWallpaper: vi.fn((url: string | null) => {
    storeState.wallpaper = url
  }),
  setWallpaperDimming: vi.fn((v: number) => {
    storeState.wallpaperDimming = v
  }),
}

import type { FavoriteWallpaper } from '@/store/useFavoriteWallpapersStore'

const favoriteState = {
  items: [] as FavoriteWallpaper[],
  add: vi.fn().mockReturnValue(true),
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: (selector?: (s: typeof storeState) => unknown) =>
    selector ? selector(storeState) : storeState,
}))

vi.mock('@/store/useFavoriteWallpapersStore', () => ({
  useFavoriteWallpapersStore: (selector?: (s: typeof favoriteState) => unknown) =>
    selector ? selector(favoriteState) : favoriteState,
}))

vi.mock('@/lib/wallhaven', () => ({
  fetchRandomWallhaven: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({ showToast: vi.fn() }))
vi.mock('@/lib/logger', () => ({ warn: vi.fn(), error: vi.fn() }))

// ---------------------------------------------------------------------------
// Import mocked modules (after vi.mock declarations)
// ---------------------------------------------------------------------------

import { useWallpaperPicker } from './useWallpaperPicker'
import { fetchRandomWallhaven } from '@/lib/wallhaven'
import { showToast } from '@/lib/toast'
import { error as logError } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWallhavenResult(overrides: Partial<WallhavenResult> = {}): WallhavenResult {
  return {
    id: 'wh-abc123',
    url: 'https://w.wallhaven.cc/full/ab/wallhaven-abc123.jpg',
    thumb: 'https://th.wallhaven.cc/small/ab/wallhaven-abc123.jpg',
    resolution: '3840x2160',
    requestedStrategy: '1M',
    actualStrategy: '1M',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWallpaperPicker', () => {
  beforeEach(() => {
    // Reset mutable mock state
    storeState.wallpaper = null
    storeState.wallpaperDimming = 0
    storeState.setWallpaper.mockClear()
    storeState.setWallpaperDimming.mockClear()

    favoriteState.items = []
    favoriteState.add.mockClear().mockReturnValue(true)

    vi.mocked(fetchRandomWallhaven).mockReset()
    vi.mocked(showToast).mockReset()
    vi.mocked(logError).mockReset()
  })

  // 1. Initial state
  it('returns correct initial state', () => {
    const { result } = renderHook(() => useWallpaperPicker())

    expect(result.current.current).toBeNull()
    expect(result.current.dimming).toBe(0)
    expect(result.current.randomLoading).toBe(false)
    expect(result.current.strategy).toBe('1M')
    expect(result.current.canFavoriteCurrent).toBe(false)
    expect(result.current.alreadyFavorited).toBe(false)
  })

  // 2. handleRandom success
  it('handleRandom sets loading, fetches wallpaper, and updates state on success', async () => {
    const mockResult = makeWallhavenResult()
    vi.mocked(fetchRandomWallhaven).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    expect(fetchRandomWallhaven).toHaveBeenCalledWith('1M')
    expect(storeState.setWallpaper).toHaveBeenCalledWith(mockResult.url)
    expect(result.current.randomLoading).toBe(false)
  })

  // 3. handleRandom with strategy fallback toast
  it('handleRandom shows toast when actualStrategy differs from requestedStrategy', async () => {
    const mockResult = makeWallhavenResult({
      requestedStrategy: '1M',
      actualStrategy: '1w',
    })
    vi.mocked(fetchRandomWallhaven).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    expect(showToast).toHaveBeenCalledWith('月榜暂无符合条件的壁纸，已切换至周榜', 'info')
  })

  // 4. handleRandom error
  it('handleRandom catches error and shows toast with error message', async () => {
    vi.mocked(fetchRandomWallhaven).mockRejectedValue(new Error('网络超时'))

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    expect(logError).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('网络超时', 'error')
    expect(result.current.randomLoading).toBe(false)
  })

  // 5. handleFavorite when canFavoriteCurrent and not already favorited
  it('handleFavorite calls addFavorite when canFavoriteCurrent and not already favorited', async () => {
    const mockResult = makeWallhavenResult()
    vi.mocked(fetchRandomWallhaven).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useWallpaperPicker())

    // First fetch a random wallpaper so lastResult is set and current matches
    await act(async () => {
      await result.current.handleRandom()
    })

    // After handleRandom, setWallpaper was called with mockResult.url,
    // but storeState.wallpaper is updated via the mock fn.
    // canFavoriteCurrent requires lastResult.url === current
    expect(result.current.canFavoriteCurrent).toBe(true)
    expect(result.current.alreadyFavorited).toBe(false)

    act(() => {
      result.current.handleFavorite()
    })

    expect(favoriteState.add).toHaveBeenCalledWith({
      id: mockResult.id,
      url: mockResult.url,
      thumb: mockResult.thumb,
      resolution: mockResult.resolution,
      source: 'wallhaven',
      strategy: mockResult.actualStrategy,
    })
    expect(showToast).toHaveBeenCalledWith('已加入收藏', 'info')
  })

  // 6. handleFavorite when already favorited (add returns false)
  it('handleFavorite shows "已经在收藏中了" when addFavorite returns false', async () => {
    const mockResult = makeWallhavenResult()
    vi.mocked(fetchRandomWallhaven).mockResolvedValue(mockResult)
    favoriteState.add.mockReturnValue(false)

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    act(() => {
      result.current.handleFavorite()
    })

    expect(favoriteState.add).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('已经在收藏中了', 'info')
  })

  // 7. canFavoriteCurrent is true when lastResult.url === current
  it('canFavoriteCurrent becomes true when lastResult.url matches current wallpaper', async () => {
    const mockResult = makeWallhavenResult({
      url: 'https://w.wallhaven.cc/full/xy/wallhaven-xy9999.jpg',
    })
    vi.mocked(fetchRandomWallhaven).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useWallpaperPicker())

    expect(result.current.canFavoriteCurrent).toBe(false)

    await act(async () => {
      await result.current.handleRandom()
    })

    // After success, storeState.wallpaper === mockResult.url and lastResult.url === mockResult.url
    expect(result.current.canFavoriteCurrent).toBe(true)
  })

  // Extra: handleFavorite is a no-op when canFavoriteCurrent is false
  it('handleFavorite does nothing when canFavoriteCurrent is false', () => {
    const { result } = renderHook(() => useWallpaperPicker())

    act(() => {
      result.current.handleFavorite()
    })

    expect(favoriteState.add).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
  })

  // Extra: alreadyFavorited reflects items in the favorites store
  it('alreadyFavorited is true when lastResult id is in favoriteItems', async () => {
    const mockResult = makeWallhavenResult({ id: 'fav-001' })
    vi.mocked(fetchRandomWallhaven).mockResolvedValue(mockResult)

    // Pre-populate favorites with the same id
    favoriteState.items = [
      {
        id: 'fav-001',
        url: 'https://example.com',
        thumb: 'https://example.com/thumb.jpg',
        addedAt: Date.now(),
        source: 'wallhaven',
      },
    ]

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    expect(result.current.alreadyFavorited).toBe(true)
  })

  // Extra: handleRandom with non-Error rejection shows default message
  it('handleRandom shows default message for non-Error rejection', async () => {
    vi.mocked(fetchRandomWallhaven).mockRejectedValue('something weird')

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    expect(showToast).toHaveBeenCalledWith('获取壁纸失败，请重试', 'error')
  })
})
