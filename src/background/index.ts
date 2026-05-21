// Wallhaven random-wallpaper fetcher.
//
// Lives in the MV3 service worker because the API requires same-origin-ish
// access (cookies, CORS) that's painful from the newtab page. We expose a
// single `fetch-wallhaven` message; the response shape mirrors what the
// frontend `fetchRandomWallhaven` helper expects in `src/lib/wallhaven.ts`.

// Allowed topRange values per wallhaven API: 1d, 3d, 1w, 1M, 3M, 6M, 1y.
// Frontend exposes 1d / 1w / 1M / 1y; if narrower windows yield zero results
// (common at off-hours), we widen to the next bucket transparently.
const VALID_TOP_RANGES = ['1d', '3d', '1w', '1M', '3M', '6M', '1y'] as const
type TopRange = (typeof VALID_TOP_RANGES)[number]

const FALLBACK_CHAIN: Record<TopRange, TopRange | null> = {
  '1d': '1w',
  '3d': '1w',
  '1w': '1M',
  '1M': '1y',
  '3M': '1y',
  '6M': '1y',
  '1y': null,
}

const MAX_PAGE_SAMPLE = 20
const REQUEST_TIMEOUT_MS = 10_000

interface WallhavenThumbs {
  large?: string
  original?: string
  small?: string
}

interface WallhavenItem {
  id: string
  path: string
  thumbs?: WallhavenThumbs
  resolution?: string
  dimension_x?: number
  dimension_y?: number
}

interface WallhavenSearchResponse {
  data?: WallhavenItem[]
  meta?: { total?: number; last_page?: number }
}

interface RateLimitedError extends Error {
  code?: 'RATE_LIMITED'
}

function buildBaseUrl(topRange: TopRange): string {
  return (
    'https://wallhaven.cc/api/v1/search' +
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

async function fetchJson(url: string, signal: AbortSignal): Promise<WallhavenSearchResponse> {
  const res = await fetch(url, { signal })
  if (res.status === 429) {
    const err: RateLimitedError = new Error('rate-limited')
    err.code = 'RATE_LIMITED'
    throw err
  }
  if (!res.ok) throw new Error('Wallhaven API: ' + res.status)
  return (await res.json()) as WallhavenSearchResponse
}

function pickRandomFromList(list: WallhavenItem[]): WallhavenItem | null {
  const pool = list.filter((x) => x && typeof x.path === 'string' && x.path)
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

async function fetchByStrategy(
  strategy: TopRange,
  signal: AbortSignal,
): Promise<{ strategy: TopRange; json: WallhavenSearchResponse | null }> {
  const base = buildBaseUrl(strategy)
  const firstPage = await fetchJson(base + '&page=1', signal)
  const meta = firstPage.meta ?? {}
  const total = typeof meta.total === 'number' ? meta.total : (firstPage.data ?? []).length
  if (!total) return { strategy, json: null }

  const lastPage = meta.last_page ?? 1
  const upper = Math.max(1, Math.min(lastPage, MAX_PAGE_SAMPLE))
  const page = Math.floor(Math.random() * upper) + 1
  if (page === 1) return { strategy, json: firstPage }
  const json = await fetchJson(base + '&page=' + page, signal)
  return { strategy, json }
}

// Try requested strategy first; if it yields nothing, widen along the chain.
async function fetchWithFallback(
  strategy: TopRange,
  signal: AbortSignal,
): Promise<{ strategy: TopRange; json: WallhavenSearchResponse | null }> {
  const result = await fetchByStrategy(strategy, signal)
  if (result.json) return result
  const next = FALLBACK_CHAIN[result.strategy]
  if (!next) return result
  console.warn('Wallhaven: empty result for ' + result.strategy + ', fallback to ' + next)
  return fetchWithFallback(next, signal)
}

function toFriendlyError(err: unknown): string {
  if (!err) return 'unknown'
  if (err instanceof Error) {
    if (err.name === 'AbortError') return '请求超时，请稍后再试'
    if ((err as RateLimitedError).code === 'RATE_LIMITED') return '请求过于频繁，请稍后再试'
    return err.message || 'unknown'
  }
  return 'unknown'
}

interface FetchWallhavenMessage {
  type: 'fetch-wallhaven'
  strategy?: string
}

function isFetchWallhavenMessage(m: unknown): m is FetchWallhavenMessage {
  return typeof m === 'object' && m !== null && (m as { type?: unknown }).type === 'fetch-wallhaven'
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isFetchWallhavenMessage(message)) return false

  const requested: TopRange =
    typeof message.strategy === 'string' &&
    (VALID_TOP_RANGES as readonly string[]).includes(message.strategy)
      ? (message.strategy as TopRange)
      : '1M'

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)

  ;(async () => {
    try {
      const result = await fetchWithFallback(requested, ctrl.signal)
      const pick = result.json ? pickRandomFromList(result.json.data ?? []) : null
      if (!pick) {
        sendResponse({ error: '当前条件下暂无符合的壁纸' })
        return
      }
      const thumb =
        (pick.thumbs && (pick.thumbs.large || pick.thumbs.original || pick.thumbs.small)) ||
        pick.path
      sendResponse({
        id: pick.id,
        url: pick.path,
        thumb,
        resolution: pick.resolution || pick.dimension_x + 'x' + pick.dimension_y,
        requestedStrategy: requested,
        actualStrategy: result.strategy,
      })
    } catch (err) {
      console.error('Wallhaven fetch error:', err)
      sendResponse({ error: toFriendlyError(err) })
    } finally {
      clearTimeout(timer)
    }
  })()

  // Keep the message channel open for the async response.
  return true
})
