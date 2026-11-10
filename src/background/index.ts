// Wallhaven random-wallpaper fetcher.
//
// Lives in the MV3 service worker so host_permissions apply even when the
// newtab page is a web origin (Vite preview). The response shape mirrors
// `fetchRandomWallhaven` in `src/lib/wallhaven.ts`.

import { logger } from '@/lib/logger'
import {
  VALID_TOP_RANGES,
  fetchRandomFromNetwork,
  toFriendlyWallhavenNetworkError,
  type TopRange,
} from '@/lib/wallhavenApi'

const REQUEST_TIMEOUT_MS = 8_000

interface FetchWallhavenMessage {
  type: 'fetch-wallhaven'
  strategy?: string
}

function isFetchWallhavenMessage(m: unknown): m is FetchWallhavenMessage {
  return typeof m === 'object' && m !== null && (m as { type?: unknown }).type === 'fetch-wallhaven'
}

// Abort any previous in-flight wallhaven fetch when a new one starts so a
// slow first click cannot finish after a fast second click and "jump twice".
let activeWallhaven: AbortController | null = null

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isFetchWallhavenMessage(message)) return false

  const requested: TopRange =
    typeof message.strategy === 'string' &&
    (VALID_TOP_RANGES as readonly string[]).includes(message.strategy)
      ? (message.strategy as TopRange)
      : '1M'

  if (activeWallhaven) {
    activeWallhaven.abort()
    activeWallhaven = null
  }

  const ctrl = new AbortController()
  activeWallhaven = ctrl
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)

  ;(async () => {
    try {
      const pick = await fetchRandomFromNetwork(requested, { signal: ctrl.signal })
      if (ctrl.signal.aborted || activeWallhaven !== ctrl) return
      sendResponse(pick)
    } catch (err) {
      if (activeWallhaven !== ctrl) return
      const message = ctrl.signal.aborted
        ? '请求超时，请稍后再试'
        : toFriendlyWallhavenNetworkError(err)
      logger.error('Wallhaven fetch error:', err)
      sendResponse({ error: message })
    } finally {
      clearTimeout(timer)
      if (activeWallhaven === ctrl) activeWallhaven = null
    }
  })()

  return true
})
