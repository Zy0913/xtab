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

vi.mock('@/lib/wallpaperCache', () => ({
  warmWallpaperCache: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/localWallpaper', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/localWallpaper')>()),
  prepareWallpaper: vi.fn(),
  saveLocalWallpaper: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({ showToast: vi.fn() }))
vi.mock('@/lib/logger', () => ({ warn: vi.fn(), error: vi.fn() }))

// ---------------------------------------------------------------------------
// Import mocked modules (after vi.mock declarations)
// ---------------------------------------------------------------------------

import { useWallpaperPicker } from './useWallpaperPicker'
import { fetchRandomWallhaven } from '@/lib/wallhaven'
import {
  MAX_UPLOAD_BYTES,
  UnreadableImageError,
  prepareWallpaper,
  saveLocalWallpaper,
  type PreparedWallpaper,
} from '@/lib/localWallpaper'
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

/** A file picked in the upload input, of `size` bytes. */
function pickFile(size = 4 * 1024 * 1024) {
  const file = new File(['picture'], 'wallpaper.png', { type: 'image/png' })
  Object.defineProperty(file, 'size', { value: size })
  const input = document.createElement('input')
  Object.defineProperty(input, 'files', { value: [file] })
  let value = 'C:\\fakepath\\wallpaper.png'
  Object.defineProperty(input, 'value', {
    get: () => value,
    set: (v: string) => {
      value = v
    },
  })
  const event = {
    target: input,
    currentTarget: input,
  } as unknown as React.ChangeEvent<HTMLInputElement>
  return { file, input, event }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
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
    vi.mocked(prepareWallpaper)
      .mockReset()
      .mockImplementation(async (file) => ({ blob: file, resizedTo: null }))
    vi.mocked(saveLocalWallpaper).mockReset().mockResolvedValue('local:m3x1k2-abc123')
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
    storeState.wallpaper = 'https://example.com/on-screen.jpg'

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    // The wallpaper on screen goes along so it isn't picked again.
    expect(fetchRandomWallhaven).toHaveBeenCalledWith('1M', 'https://example.com/on-screen.jpg')
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

  it('handleRandom shows Bing toast and does not mark as favorite-able', async () => {
    vi.mocked(fetchRandomWallhaven).mockResolvedValue(
      makeWallhavenResult({
        via: 'bing',
        url: 'https://www.bing.com/th?id=OHR.x_1920x1080.jpg',
      }),
    )

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    expect(storeState.setWallpaper).toHaveBeenCalledWith(
      'https://www.bing.com/th?id=OHR.x_1920x1080.jpg',
    )
    expect(result.current.canFavoriteCurrent).toBe(false)
    expect(showToast).toHaveBeenCalledWith('排行榜暂时连不上，已换一张必应壁纸', 'info')
  })

  // 4. handleRandom error
  it('handleRandom falls back to a preset when Wallhaven fails', async () => {
    vi.mocked(fetchRandomWallhaven).mockRejectedValue(new Error('请求超时，请稍后再试'))

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    expect(logError).not.toHaveBeenCalled()
    expect(storeState.setWallpaper).toHaveBeenCalled()
    const url = storeState.setWallpaper.mock.calls[0][0]
    expect(url).toEqual(expect.any(String))
    expect(url as string).not.toHaveLength(0)
    expect(showToast).toHaveBeenCalledWith('排行榜暂时连不上，已换一张备用壁纸', 'info')
    expect(result.current.randomLoading).toBe(false)
  })

  // 4b. Stale random result must not override a newer click
  it('handleRandom ignores stale result when a newer request is in flight', async () => {
    let resolveSlow: (v: WallhavenResult) => void
    const slow = new Promise<WallhavenResult>((r) => {
      resolveSlow = r
    })
    const fast = makeWallhavenResult({
      id: 'fast',
      url: 'https://w.wallhaven.cc/full/ff/wallhaven-fast.jpg',
    })
    const slowResult = makeWallhavenResult({
      id: 'slow',
      url: 'https://w.wallhaven.cc/full/ss/wallhaven-slow.jpg',
    })

    vi.mocked(fetchRandomWallhaven)
      .mockImplementationOnce(() => slow)
      .mockImplementationOnce(() => Promise.resolve(fast))

    const { result } = renderHook(() => useWallpaperPicker())

    let slowDone!: Promise<void>
    act(() => {
      slowDone = result.current.handleRandom()
    })
    await act(async () => {
      await result.current.handleRandom()
    })

    expect(storeState.setWallpaper).toHaveBeenCalledTimes(1)
    expect(storeState.setWallpaper).toHaveBeenCalledWith(fast.url)

    await act(async () => {
      resolveSlow!(slowResult)
      await slowDone
    })

    // Slow response must not apply a second wallpaper.
    expect(storeState.setWallpaper).toHaveBeenCalledTimes(1)
    expect(storeState.setWallpaper).toHaveBeenLastCalledWith(fast.url)
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

  // Extra: handleRandom with non-Error rejection still uses the fallback
  it('handleRandom falls back for non-Error rejection', async () => {
    vi.mocked(fetchRandomWallhaven).mockRejectedValue('something weird')

    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleRandom()
    })

    expect(storeState.setWallpaper).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('排行榜暂时连不上，已换一张备用壁纸', 'info')
  })
  // Uploads
  it('handleUpload keeps a 4K picture of 30MB and points the wallpaper at it', async () => {
    const { file, input, event } = pickFile(30 * 1024 * 1024)
    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleUpload(event)
    })

    expect(prepareWallpaper).toHaveBeenCalledWith(file)
    expect(saveLocalWallpaper).toHaveBeenCalledWith(file)
    expect(storeState.setWallpaper).toHaveBeenCalledWith('local:m3x1k2-abc123')
    expect(showToast).not.toHaveBeenCalled()
    expect(result.current.uploading).toBe(false)
    // Cleared, so picking the same file again counts as a change.
    expect(input.value).toBe('')
  })

  it('handleUpload refuses a file over the limit', async () => {
    const { input, event } = pickFile(MAX_UPLOAD_BYTES + 1)
    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleUpload(event)
    })

    expect(showToast).toHaveBeenCalledWith('图片过大，请选择不超过 50MB 的文件', 'error')
    expect(prepareWallpaper).not.toHaveBeenCalled()
    expect(storeState.setWallpaper).not.toHaveBeenCalled()
    expect(input.value).toBe('')
  })

  it('handleUpload says when a picture larger than 8K was scaled down', async () => {
    const webp = new Blob(['webp'], { type: 'image/webp' })
    vi.mocked(prepareWallpaper).mockResolvedValue({
      blob: webp,
      resizedTo: { width: 7680, height: 4320 },
    })
    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleUpload(pickFile().event)
    })

    expect(saveLocalWallpaper).toHaveBeenCalledWith(webp)
    expect(storeState.setWallpaper).toHaveBeenCalledWith('local:m3x1k2-abc123')
    expect(showToast).toHaveBeenCalledWith('图片超过 8K，已缩小到 7680×4320', 'info')
  })

  it('handleUpload explains a picture the browser cannot read', async () => {
    vi.mocked(prepareWallpaper).mockRejectedValue(new UnreadableImageError())
    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleUpload(pickFile().event)
    })

    expect(showToast).toHaveBeenCalledWith('无法读取这张图片，换成 JPG、PNG 或 WebP 试试', 'error')
    expect(saveLocalWallpaper).not.toHaveBeenCalled()
    expect(storeState.setWallpaper).not.toHaveBeenCalled()
    expect(result.current.uploading).toBe(false)
  })

  it('handleUpload reports a picture that could not be kept, and keeps the wallpaper', async () => {
    vi.mocked(saveLocalWallpaper).mockRejectedValue(new Error('QuotaExceededError'))
    const { result } = renderHook(() => useWallpaperPicker())

    await act(async () => {
      await result.current.handleUpload(pickFile().event)
    })

    expect(showToast).toHaveBeenCalledWith('图片没能保存，请重试', 'error')
    expect(logError).toHaveBeenCalled()
    expect(storeState.setWallpaper).not.toHaveBeenCalled()
  })

  it('shows the upload as busy while the picture is readied', async () => {
    const prepared = deferred<PreparedWallpaper>()
    vi.mocked(prepareWallpaper).mockReturnValue(prepared.promise)
    const { file, event } = pickFile()
    const { result } = renderHook(() => useWallpaperPicker())

    let done!: Promise<void>
    act(() => {
      done = result.current.handleUpload(event)
    })
    expect(result.current.uploading).toBe(true)

    await act(async () => {
      prepared.resolve({ blob: file, resizedTo: null })
      await done
    })
    expect(result.current.uploading).toBe(false)
  })

  it('a random pick made while an upload is readied wins', async () => {
    const prepared = deferred<PreparedWallpaper>()
    vi.mocked(prepareWallpaper).mockReturnValue(prepared.promise)
    const random = makeWallhavenResult()
    vi.mocked(fetchRandomWallhaven).mockResolvedValue(random)
    const { file, event } = pickFile()
    const { result } = renderHook(() => useWallpaperPicker())

    let uploadDone!: Promise<void>
    act(() => {
      uploadDone = result.current.handleUpload(event)
    })
    await act(async () => {
      await result.current.handleRandom()
    })
    expect(result.current.uploading).toBe(false)

    await act(async () => {
      prepared.resolve({ blob: file, resizedTo: null })
      await uploadDone
    })
    expect(storeState.setWallpaper).toHaveBeenCalledTimes(1)
    expect(storeState.setWallpaper).toHaveBeenLastCalledWith(random.url)
  })

  it('a preset picked while an upload is readied wins', async () => {
    const prepared = deferred<PreparedWallpaper>()
    vi.mocked(prepareWallpaper).mockReturnValue(prepared.promise)
    const { file, event } = pickFile()
    const { result } = renderHook(() => useWallpaperPicker())

    let uploadDone!: Promise<void>
    act(() => {
      uploadDone = result.current.handleUpload(event)
    })
    act(() => {
      result.current.setWallpaper('https://example.com/preset.jpg')
    })
    expect(result.current.uploading).toBe(false)

    await act(async () => {
      prepared.resolve({ blob: file, resizedTo: null })
      await uploadDone
    })
    expect(storeState.setWallpaper).toHaveBeenCalledTimes(1)
    expect(storeState.setWallpaper).toHaveBeenLastCalledWith('https://example.com/preset.jpg')
  })
})
