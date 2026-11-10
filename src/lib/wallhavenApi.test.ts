import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  buildSearchUrl,
  fetchRandomFromNetwork,
  isSafeWallhavenUrl,
  pickRandomFromList,
  toFriendlyWallhavenNetworkError,
} from './wallhavenApi'

describe('wallhavenApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds a toplist search URL against the given origin', () => {
    expect(buildSearchUrl('1M', '/__wallhaven')).toBe(
      '/__wallhaven/api/v1/search?categories=111&purity=100&sorting=toplist&order=desc&topRange=1M&atleast=1920x1080&ratios=16x9,16x10,21x9',
    )
  })

  it('accepts only wallhaven image hosts', () => {
    expect(isSafeWallhavenUrl('https://w.wallhaven.cc/full/ab/wallhaven-ab.jpg')).toBe(true)
    expect(isSafeWallhavenUrl('https://evil.example/x.jpg')).toBe(false)
  })

  it('picks only safe paths', () => {
    expect(pickRandomFromList([{ id: 'bad', path: 'https://evil.example/x.jpg' }])).toBeNull()
    const pick = pickRandomFromList([
      { id: 'ok', path: 'https://w.wallhaven.cc/full/ab/wallhaven-ok.jpg' },
    ])
    expect(pick?.id).toBe('ok')
  })

  it('maps failed fetch to Chinese', () => {
    expect(toFriendlyWallhavenNetworkError(new TypeError('Failed to fetch'))).toBe(
      '无法连接到排行榜服务',
    )
  })

  it('fetches and maps a search payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'abc',
              path: 'https://w.wallhaven.cc/full/ab/wallhaven-abc.jpg',
              thumbs: { large: 'https://th.wallhaven.cc/small/ab/abc.jpg' },
              resolution: '3840x2160',
            },
          ],
          meta: { total: 1 },
        }),
      }),
    )

    const result = await fetchRandomFromNetwork('1w', { origin: '/__wallhaven' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/__wallhaven/api/v1/search'),
      expect.any(Object),
    )
    expect(result).toMatchObject({
      id: 'abc',
      url: 'https://w.wallhaven.cc/full/ab/wallhaven-abc.jpg',
      requestedStrategy: '1w',
      actualStrategy: '1w',
    })
  })
})
