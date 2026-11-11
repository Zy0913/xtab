import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRandomBingWallpaper } from './bingWallpaper'

const day = (i: number) => ({ url: `/th?id=OHR.Day${i}_1920x1080.jpg&pid=hp`, startdate: `d${i}` })
const dayUrl = (i: number, host = 'www.bing.com') =>
  `https://${host}/th?id=OHR.Day${i}_1920x1080.jpg&pid=hp`

function archiveOk(images: ReturnType<typeof day>[]) {
  return { ok: true, status: 200, json: async () => ({ images }) }
}

/** What the archive answers for `idx`: 8 days, starting `idx` days back. */
function archiveFor(url: string) {
  const idx = Number(new URL(url).searchParams.get('idx'))
  return archiveOk(Array.from({ length: 8 }, (_, i) => day(idx + i)))
}

describe('fetchRandomBingWallpaper', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reaches back all 15 days the archive keeps', async () => {
    const fetchMock = vi.fn((url: string) => Promise.resolve(archiveFor(url)))
    vi.stubGlobal('fetch', fetchMock)
    const shown = Array.from({ length: 14 }, (_, i) => dayUrl(i))

    // Day 14 comes only from the second request.
    await expect(fetchRandomBingWallpaper('1M', undefined, shown)).resolves.toMatchObject({
      id: 'bing-d14',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('uses cn.bing.com when www fails, still passing over what was shown', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        url.startsWith('https://www.bing.com')
          ? Promise.reject(new TypeError('Failed to fetch'))
          : Promise.resolve(archiveOk([day(0), day(1)])),
      ),
    )

    await expect(fetchRandomBingWallpaper('1M', undefined, [dayUrl(0)])).resolves.toMatchObject({
      url: dayUrl(1, 'cn.bing.com'),
    })
  })

  it('maps a Bing archive item to a wallpaper pick', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          images: [
            {
              url: '/th?id=OHR.Palmanova_1920x1080.jpg&pid=hp',
              startdate: '20260818',
            },
          ],
        }),
      }),
    )

    const pick = await fetchRandomBingWallpaper('1M')
    expect(pick).toMatchObject({
      id: 'bing-20260818',
      via: 'bing',
      url: 'https://www.bing.com/th?id=OHR.Palmanova_1920x1080.jpg&pid=hp',
    })
  })

  it('rejects unsafe image hosts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          images: [{ url: 'https://evil.example/x.jpg', startdate: '1' }],
        }),
      }),
    )
    await expect(fetchRandomBingWallpaper('1d')).rejects.toThrow()
  })
})
