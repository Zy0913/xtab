import { useCallback, useEffect, useState } from 'react'

export interface OpenTab {
  id: number
  windowId: number
  title: string
  url: string
  favIconUrl?: string
  isCurrentWindow: boolean
  isActive: boolean
}

export interface OpenTabsGroup {
  windowId: number
  isCurrent: boolean
  tabs: OpenTab[]
}

const EXCLUDED_PROTOCOLS = [
  'chrome:',
  'chrome-extension:',
  'chrome-search:',
  'chrome-devtools:',
  'devtools:',
  'edge:',
  'about:',
  'view-source:',
  'file:',
]

/**
 * Canonical key for comparing two URLs that point to the "same" page.
 * Lowercases the host and strips a single trailing slash so that
 * `https://github.com` and `https://github.com/` collide.
 */
export function normalizeUrlKey(url: string): string {
  try {
    const u = new URL(url)
    const host = u.host.toLowerCase()
    const path = u.pathname === '/' ? '' : u.pathname.replace(/\/+$/, '')
    return `${u.protocol}//${host}${path}${u.search}${u.hash}`
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '')
  }
}

export function isUsableTab(
  tab: chrome.tabs.Tab,
): tab is chrome.tabs.Tab & { url: string; id: number } {
  if (typeof tab.id !== 'number' || tab.id < 0 || !tab.url) return false
  try {
    const proto = new URL(tab.url).protocol
    if (EXCLUDED_PROTOCOLS.includes(proto)) return false
  } catch {
    return false
  }
  return true
}

export function dedupByUrl(tabs: OpenTab[]): OpenTab[] {
  const map = new Map<string, OpenTab>()
  for (const t of tabs) {
    const key = normalizeUrlKey(t.url)
    const existing = map.get(key)
    if (!existing) {
      map.set(key, t)
      continue
    }
    const tLen = t.title?.length ?? 0
    const eLen = existing.title?.length ?? 0
    // Title length is the primary signal; current-window only breaks ties.
    const prefer = tLen > eLen || (tLen === eLen && t.isCurrentWindow && !existing.isCurrentWindow)
    if (prefer) map.set(key, t)
  }
  return [...map.values()]
}

export function buildOpenTabs(
  rawTabs: chrome.tabs.Tab[],
  currentWinId: number | undefined,
): OpenTab[] {
  const mapped: OpenTab[] = rawTabs.filter(isUsableTab).map((t) => ({
    id: t.id,
    windowId: t.windowId,
    title: t.title?.trim() || new URL(t.url).hostname,
    url: t.url,
    favIconUrl: t.favIconUrl && /^https?:/i.test(t.favIconUrl) ? t.favIconUrl : undefined,
    isCurrentWindow: t.windowId === currentWinId,
    isActive: !!t.active,
  }))
  return dedupByUrl(mapped)
}

const REFRESH_DEBOUNCE_MS = 150

export function useOpenTabs(enabled: boolean) {
  const [tabs, setTabs] = useState<OpenTab[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) return
    chrome.windows?.getCurrent((win) => {
      const currentWinId = win?.id
      chrome.tabs.query({}, (rawTabs) => {
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message ?? '读取标签页失败')
          return
        }
        setError(null)
        setTabs(buildOpenTabs(rawTabs, currentWinId))
      })
    })
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) return

    refresh()

    let timer: number | null = null
    const schedule = () => {
      if (timer !== null) clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = null
        refresh()
      }, REFRESH_DEBOUNCE_MS)
    }

    const onUpdated = (_id: number, info: chrome.tabs.TabChangeInfo) => {
      // Skip noisy fields (loading state, audible/muted, attention) — only
      // refresh when something we render or filter on actually changed.
      if (
        info.status === 'complete' ||
        typeof info.url === 'string' ||
        typeof info.title === 'string' ||
        typeof info.favIconUrl === 'string'
      ) {
        schedule()
      }
    }
    const onSimple = () => schedule()

    chrome.tabs.onUpdated.addListener(onUpdated)
    chrome.tabs.onRemoved.addListener(onSimple)
    chrome.tabs.onCreated.addListener(onSimple)
    return () => {
      if (timer !== null) clearTimeout(timer)
      chrome.tabs.onUpdated.removeListener(onUpdated)
      chrome.tabs.onRemoved.removeListener(onSimple)
      chrome.tabs.onCreated.removeListener(onSimple)
    }
  }, [enabled, refresh])

  return { tabs, error, refresh }
}

export function groupTabsByWindow(tabs: OpenTab[]): OpenTabsGroup[] {
  const groups = new Map<number, OpenTabsGroup>()
  for (const t of tabs) {
    const g = groups.get(t.windowId)
    if (g) {
      g.tabs.push(t)
    } else {
      groups.set(t.windowId, {
        windowId: t.windowId,
        isCurrent: t.isCurrentWindow,
        tabs: [t],
      })
    }
  }
  return [...groups.values()].sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent))
}
