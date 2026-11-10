import { logger } from '@/lib/logger'

/** Allowed topRange values per Wallhaven API. */
export const VALID_TOP_RANGES = ['1d', '3d', '1w', '1M', '3M', '6M', '1y'] as const
export type TopRange = (typeof VALID_TOP_RANGES)[number]

export const FALLBACK_CHAIN: Record<TopRange, TopRange | null> = {
  '1d': '1w',
  '3d': '1w',
  '1w': '1M',
  '1M': '1y',
  '3M': '1y',
  '6M': '1y',
  '1y': null,
}

export interface WallhavenThumbs {
  large?: string
  original?: string
  small?: string
}

export interface WallhavenItem {
  id: string
  path: string
  thumbs?: WallhavenThumbs
  resolution?: string
  dimension_x?: number
  dimension_y?: number
}

export interface WallhavenSearchResponse {
  data?: WallhavenItem[]
  meta?: { total?: number; last_page?: number }
}

export interface WallhavenPick {
  id: string
  url: string
  thumb: string
  resolution?: string
  requestedStrategy: TopRange
  actualStrategy: TopRange
  via?: 'wallhaven' | 'bing'
}

export interface RateLimitedError extends Error {
  code?: 'RATE_LIMITED'
}

/** Vite reverse-proxy prefix so the newtab page can call Wallhaven without CORS. */
export const WALLHAVEN_DEV_PROXY_PREFIX = '/__wallhaven'

export function normalizeWallhavenOrigin(origin: string): string {
  return origin.replace(/\/+$/, '')
}

export function buildSearchUrl(topRange: TopRange, origin = 'https://wallhaven.cc'): string {
  return (
    `${normalizeWallhavenOrigin(origin)}/api/v1/search` +
    '?categories=111' +
    '&purity=100' +
    '&sorting=toplist' +
    '&order=desc' +
    '&topRange=' +
    topRange +
    '&atleast=1920x1080' +
    '&ratios=16x9,16x10,21x9'
  )
}

export function isSafeWallhavenUrl(u: unknown): u is string {
  return typeof u === 'string' && /^https:\/\/[^/]*\.wallhaven\.cc\//i.test(u)
}

export function pickRandomFromList(list: WallhavenItem[]): WallhavenItem | null {
  const pool = list.filter((x) => x && isSafeWallhavenUrl(x.path))
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export function toFriendlyWallhavenNetworkError(err: unknown): string {
  if (!err) return '获取壁纸失败，请重试'
  if (err instanceof Error) {
    if (err.name === 'AbortError') return '请求超时，请稍后再试'
    if ((err as RateLimitedError).code === 'RATE_LIMITED') return '请求过于频繁，请稍后再试'
    if (/Failed to fetch|NetworkError|Load failed|Network request failed/i.test(err.message)) {
      return '无法连接到排行榜服务'
    }
    return err.message || '获取壁纸失败，请重试'
  }
  return '获取壁纸失败，请重试'
}

export async function fetchSearchJson(
  url: string,
  signal?: AbortSignal,
): Promise<WallhavenSearchResponse> {
  const res = await fetch(url, { signal })
  if (res.status === 429) {
    const err: RateLimitedError = new Error('rate-limited')
    err.code = 'RATE_LIMITED'
    throw err
  }
  if (!res.ok) throw new Error('Wallhaven API: ' + res.status)
  return (await res.json()) as WallhavenSearchResponse
}

async function fetchByStrategy(
  strategy: TopRange,
  origin: string,
  signal?: AbortSignal,
): Promise<{ strategy: TopRange; json: WallhavenSearchResponse | null }> {
  const firstPage = await fetchSearchJson(buildSearchUrl(strategy, origin) + '&page=1', signal)
  const total =
    typeof firstPage.meta?.total === 'number' ? firstPage.meta.total : (firstPage.data ?? []).length
  if (!total) return { strategy, json: null }
  return { strategy, json: firstPage }
}

export async function fetchWithFallback(
  strategy: TopRange,
  origin: string,
  signal?: AbortSignal,
): Promise<{ strategy: TopRange; json: WallhavenSearchResponse | null }> {
  const result = await fetchByStrategy(strategy, origin, signal)
  if (result.json) return result
  const next = FALLBACK_CHAIN[result.strategy]
  if (!next) return result
  logger.warn('Wallhaven: empty result for ' + result.strategy + ', fallback to ' + next)
  return fetchWithFallback(next, origin, signal)
}

export function itemToPick(
  pick: WallhavenItem,
  requested: TopRange,
  actual: TopRange,
): WallhavenPick {
  const thumbRaw =
    (pick.thumbs && (pick.thumbs.large || pick.thumbs.original || pick.thumbs.small)) || pick.path
  const thumb = isSafeWallhavenUrl(thumbRaw) ? thumbRaw : pick.path
  return {
    id: pick.id,
    url: pick.path,
    thumb,
    resolution: pick.resolution || pick.dimension_x + 'x' + pick.dimension_y,
    requestedStrategy: requested,
    actualStrategy: actual,
  }
}

export async function fetchRandomFromNetwork(
  requested: TopRange,
  options: { origin?: string; signal?: AbortSignal } = {},
): Promise<WallhavenPick> {
  const origin = options.origin ?? 'https://wallhaven.cc'
  const result = await fetchWithFallback(requested, origin, options.signal)
  const pick = result.json ? pickRandomFromList(result.json.data ?? []) : null
  if (!pick) throw new Error('当前条件下暂无符合的壁纸')
  return { ...itemToPick(pick, requested, result.strategy), via: 'wallhaven' }
}
