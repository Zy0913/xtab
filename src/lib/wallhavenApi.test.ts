import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  buildSearchUrl,
  fetchRandomFromNetwork,
  isSafeWallhavenUrl,
  pickRandomFromList,
  toFriendlyWallhavenNetworkError,
  TOPLIST_DEPTH,
} from './wallhavenApi'

const item = (id: string) => ({ id, path: `https://w.wallhaven.cc/full/${id}/wallhaven-${id}.jpg` })

function searchOk(data: ReturnType<typeof item>[], meta: { total: number; last_page: number }) {
  return { ok: true, status: 200, json: async () => ({ data, meta }) }
}

describe('wallhavenApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
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

  it('draws a page from the top of the toplist, not always the first', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(searchOk([item('abc')], { total: 1189, last_page: 50 }))
    vi.stubGlobal('fetch', fetchMock)

    vi.spyOn(Math, 'random').mockReturnValue(0)
    await fetchRandomFromNetwork('1M', { origin: '/__wallhaven' })
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    await fetchRandomFromNetwork('1M', { origin: '/__wallhaven' })

    expect(fetchMock.mock.calls[0][0]).toMatch(/&page=1$/)
    expect(fetchMock.mock.calls[1][0]).toMatch(new RegExp(`&page=${TOPLIST_DEPTH['1M']}$`))
  })

  it('draws again within a list shorter than the page drawn', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(searchOk([], { total: 10, last_page: 1 }))
      .mockResolvedValueOnce(searchOk([item('only')], { total: 10, last_page: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(Math, 'random').mockReturnValue(0.999) // page 2 of the day list

    await expect(fetchRandomFromNetwork('1d', { origin: '/__wallhaven' })).resolves.toMatchObject({
      id: 'only',
    })
    expect(fetchMock.mock.calls[0][0]).toMatch(/&page=2$/)
    expect(fetchMock.mock.calls[1][0]).toMatch(/&page=1$/)
  })

  it('passes over pictures shown lately', async () => {
    const page = [item('a'), item('b'), item('c')]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(searchOk(page, { total: 3, last_page: 1 })))
    vi.spyOn(Math, 'random').mockReturnValue(0)

    await expect(
      fetchRandomFromNetwork('1w', {
        origin: '/__wallhaven',
        recent: [page[0].path, page[1].path],
      }),
    ).resolves.toMatchObject({ id: 'c' })
  })
})
