import type { TopRange, WallhavenPick } from '@/lib/wallhavenApi'

const BING_ENDPOINTS = [
  'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN',
  'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN',
] as const

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

function isSafeBingImageUrl(u: unknown): u is string {
  return typeof u === 'string' && /^https:\/\/(www|cn)\.bing\.com\/th\?/i.test(u)
}

function resolveBingUrl(
  host: 'www.bing.com' | 'cn.bing.com',
  path: string | undefined,
): string | null {
  if (!path) return null
  const url = path.startsWith('http') ? path : `https://${host}${path}`
  return isSafeBingImageUrl(url) ? url : null
}

function hostFromEndpoint(endpoint: string): 'www.bing.com' | 'cn.bing.com' {
  return endpoint.includes('cn.bing.com') ? 'cn.bing.com' : 'www.bing.com'
}

export async function fetchRandomBingWallpaper(
  strategy: TopRange,
  signal?: AbortSignal,
): Promise<WallhavenPick> {
  let lastError: unknown
  for (const endpoint of BING_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, { signal })
      if (!res.ok) throw new Error('Bing API: ' + res.status)
      const json = (await res.json()) as BingArchive
      const pool: WallhavenPick[] = []
      const host = hostFromEndpoint(endpoint)
      for (const img of json.images ?? []) {
        const url = resolveBingUrl(host, img.url)
        if (!url) continue
        pool.push({
          id: img.startdate ? `bing-${img.startdate}` : `bing-${url}`,
          url,
          thumb: url,
          resolution: '1920x1080',
          requestedStrategy: strategy,
          actualStrategy: strategy,
          via: 'bing',
        })
      }
      if (!pool.length) throw new Error('Bing 返回数据异常')
      return pool[Math.floor(Math.random() * pool.length)]
    } catch (err) {
      lastError = err
      if (signal?.aborted) throw err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('无法获取必应壁纸')
}
