import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRandomWallhaven, WALLHAVEN_SOFT_TIMEOUT_MS } from './wallhaven'

function wallhavenOk() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: [
        {
          id: 'page-1',
          path: 'https://w.wallhaven.cc/full/ab/wallhaven-page.jpg',
          thumbs: { large: 'https://th.wallhaven.cc/small/ab/page.jpg' },
          resolution: '1920x1080',
        },
      ],
      meta: { total: 1 },
    }),
  }
}

function bingOk() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      images: [
        {
          url: '/th?id=OHR.Demo_1920x1080.jpg',
          urlbase: '/th?id=OHR.Demo',
          startdate: '20260818',
          title: 'Demo',
        },
      ],
    }),
  }
}

describe('fetchRandomWallhaven', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('fetches via the page proxy when chrome.runtime is missing', async () => {
    vi.stubGlobal('chrome', undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(wallhavenOk()))
    await expect(fetchRandomWallhaven('1M')).resolves.toMatchObject({
      id: 'page-1',
      url: 'https://w.wallhaven.cc/full/ab/wallhaven-page.jpg',
      via: 'wallhaven',
    })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/__wallhaven/api/v1/search'),
      expect.any(Object),
    )
  })

  it('fetches wallhaven.cc from the extension page instead of the service worker', async () => {
    const sendMessage = vi.fn()
    vi.stubGlobal('chrome', { runtime: { id: 'ext-id', sendMessage } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(wallhavenOk()))

    await expect(fetchRandomWallhaven('1M')).resolves.toMatchObject({
      id: 'page-1',
      via: 'wallhaven',
    })
    expect(sendMessage).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://wallhaven.cc/api/v1/search'),
      expect.any(Object),
    )
  })

  it('falls back to Bing when Wallhaven fails', async () => {
    vi.stubGlobal('chrome', { runtime: { id: 'ext-id' } })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(bingOk()),
    )

    await expect(fetchRandomWallhaven('1w')).resolves.toMatchObject({
      id: 'bing-20260818',
      url: 'https://www.bing.com/th?id=OHR.Demo_1920x1080.jpg',
      via: 'bing',
    })
  })

  it('prefers Wallhaven when it returns before the soft timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('chrome', { runtime: { id: 'ext-id' } })
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (String(url).includes('wallhaven.cc')) {
          return new Promise((resolve) => {
            setTimeout(() => resolve(wallhavenOk()), 400)
          })
        }
        return Promise.resolve(bingOk())
      }),
    )

    const pending = fetchRandomWallhaven('1M')
    await vi.advanceTimersByTimeAsync(400)
    await expect(pending).resolves.toMatchObject({ via: 'wallhaven', id: 'page-1' })
  })

  it('does not wait out the hard Wallhaven timeout when Bing is ready', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('chrome', { runtime: { id: 'ext-id' } })
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (String(url).includes('wallhaven.cc')) return new Promise(() => {})
        return Promise.resolve(bingOk())
      }),
    )

    const pending = fetchRandomWallhaven('1M')
    const resolved = vi.fn()
    void pending.then(resolved)

    await vi.advanceTimersByTimeAsync(WALLHAVEN_SOFT_TIMEOUT_MS - 100)
    expect(resolved).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(200)
    await expect(pending).resolves.toMatchObject({
      via: 'bing',
      id: 'bing-20260818',
    })
  })
})
