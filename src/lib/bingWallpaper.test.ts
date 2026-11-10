import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRandomBingWallpaper } from './bingWallpaper'

describe('fetchRandomBingWallpaper', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
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
