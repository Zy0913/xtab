import type { TopRange, WallhavenPick } from '@/lib/wallhavenApi'
import { pickFresh } from '@/lib/recentWallpapers'

/** Tried in order; cn.bing.com answers where www.bing.com doesn't. */
const BING_HOSTS = ['www.bing.com', 'cn.bing.com'] as const
type BingHost = (typeof BING_HOSTS)[number]

/** The archive keeps 15 days and serves at most 8 a request, starting at
    most 7 days back, so these two requests cover all of it. */
const ARCHIVE_OFFSETS = [0, 7] as const

interface BingImage {
  url?: string
  urlbase?: string
  startdate?: string
  title?: string
  copyright?: string
}

interface BingArchive {
  images?: BingImage[]
}

export const BING_CLIENT_TIMEOUT_MS = 6_000

function archiveUrl(host: BingHost, idx: number): string {
  return `https://${host}/HPImageArchive.aspx?format=js&idx=${idx}&n=8&mkt=zh-CN`
}

function isSafeBingImageUrl(u: unknown): u is string {
  return typeof u === 'string' && /^https:\/\/(www|cn)\.bing\.com\/th\?/i.test(u)
}

function resolveBingUrl(host: BingHost, path: string | undefined): string | null {
  if (!path) return null
  const url = path.startsWith('http') ? path : `https://${host}${path}`
  return isSafeBingImageUrl(url) ? url : null
}

/** Every picture the archive on `host` keeps, one per day. */
async function fetchArchive(
  host: BingHost,
  strategy: TopRange,
  signal?: AbortSignal,
): Promise<WallhavenPick[]> {
  const pages = await Promise.allSettled(
    ARCHIVE_OFFSETS.map(async (idx) => {
      const res = await fetch(archiveUrl(host, idx), { signal })
      if (!res.ok) throw new Error('Bing API: ' + res.status)
      return ((await res.json()) as BingArchive).images ?? []
    }),
  )
  // The two requests overlap by a day.
  const byDay = new Map<string, WallhavenPick>()
  for (const page of pages) {
    if (page.status !== 'fulfilled') continue
    for (const img of page.value) {
      const url = resolveBingUrl(host, img.url)
      if (!url) continue
      const id = img.startdate ? `bing-${img.startdate}` : `bing-${url}`
      if (byDay.has(id)) continue
      byDay.set(id, {
        id,
        url,
        thumb: url,
        resolution: '1920x1080',
        requestedStrategy: strategy,
        actualStrategy: strategy,
        via: 'bing',
      })
    }
  }
  if (!byDay.size) {
    const failed = pages.find((p) => p.status === 'rejected')
    throw failed?.status === 'rejected' ? failed.reason : new Error('Bing 返回数据异常')
  }
  return [...byDay.values()]
}

/** A Bing picture of the day from the last 15 days, preferring ones not in `recent`. */
export async function fetchRandomBingWallpaper(
  strategy: TopRange,
  signal?: AbortSignal,
  recent: readonly string[] = [],
): Promise<WallhavenPick> {
  let lastError: unknown
  for (const host of BING_HOSTS) {
    try {
      const pick = pickFresh(await fetchArchive(host, strategy, signal), (p) => p.url, recent)
      if (pick) return pick
    } catch (err) {
      lastError = err
      if (signal?.aborted) throw err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('无法获取必应壁纸')
}
