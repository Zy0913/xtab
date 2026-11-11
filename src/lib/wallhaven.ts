import {
  VALID_TOP_RANGES,
  WALLHAVEN_DEV_PROXY_PREFIX,
  fetchRandomFromNetwork,
  toFriendlyWallhavenNetworkError,
  type WallhavenPick,
} from '@/lib/wallhavenApi'
import { BING_CLIENT_TIMEOUT_MS, fetchRandomBingWallpaper } from '@/lib/bingWallpaper'
import { recentWallpapers } from '@/lib/recentWallpapers'

export type WallhavenStrategy = '1d' | '1w' | '1M' | '1y'

export type WallhavenResult = WallhavenPick

export const WALLHAVEN_CLIENT_TIMEOUT_MS = 8_000
/** Prefer Wallhaven, but don't stall the packed newtab on a GFW hang. */
export const WALLHAVEN_SOFT_TIMEOUT_MS = 2_000

/** Extension pages talk to wallhaven.cc directly. Vite needs the local proxy. */
export function wallhavenApiOrigin(): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) return 'https://wallhaven.cc'
  return WALLHAVEN_DEV_PROXY_PREFIX
}

type Settled<T> = { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }

function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ status: 'fulfilled', value }),
    (reason) => ({ status: 'rejected', reason }),
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function fetchWithTimeout<T>(
  timeoutMs: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await run(ctrl.signal)
  } finally {
    clearTimeout(timer)
  }
}

async function fetchViaPage(
  strategy: WallhavenStrategy,
  recent: readonly string[],
): Promise<WallhavenResult> {
  try {
    return await fetchWithTimeout(WALLHAVEN_CLIENT_TIMEOUT_MS, (signal) =>
      fetchRandomFromNetwork(strategy, {
        origin: wallhavenApiOrigin(),
        signal,
        recent,
      }),
    )
  } catch (err) {
    throw new Error(toFriendlyWallhavenNetworkError(err), { cause: err })
  }
}

async function fetchViaBing(
  strategy: WallhavenStrategy,
  recent: readonly string[],
): Promise<WallhavenResult> {
  return fetchWithTimeout(BING_CLIENT_TIMEOUT_MS, (signal) =>
    fetchRandomBingWallpaper(strategy, signal, recent),
  )
}

/**
 * Packed newtab talks to Wallhaven from the page (host_permissions).
 * The service worker path is unreliable: some proxies skip SW sockets,
 * and an aborted SW fetch used to swallow sendResponse so the page always
 * waited out a second timeout.
 *
 * Wallhaven is often blocked in CN and hangs until the hard abort. After a
 * short wait we take Bing (or a late Wallhaven success) instead of stalling.
 *
 * Pictures shown lately, and `current` on screen now, are passed over while
 * others remain, so clicking through doesn't bring back what was just seen.
 */
export async function fetchRandomWallhaven(
  strategy: WallhavenStrategy,
  current?: string | null,
): Promise<WallhavenResult> {
  if (!(VALID_TOP_RANGES as readonly string[]).includes(strategy)) {
    strategy = '1M'
  }

  const recent = recentWallpapers()
  if (current) recent.push(current)

  const wallhaven = settle(fetchViaPage(strategy, recent))
  const first = await Promise.race([wallhaven, delay(WALLHAVEN_SOFT_TIMEOUT_MS).then(() => null)])

  if (first?.status === 'fulfilled') return first.value

  try {
    return await fetchViaBing(strategy, recent)
  } catch {
    const late = first ?? (await wallhaven)
    if (late.status === 'fulfilled') return late.value
    throw late.reason
  }
}
