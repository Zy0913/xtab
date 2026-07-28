import { warn } from '@/lib/logger'

export function getFaviconUrl(targetUrl: string): string {
  try {
    const domain = new URL(targetUrl).hostname
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`
  } catch {
    warn('Invalid URL for favicon')
    return ''
  }
}

export function getFaviconSources(url: string): string[] {
  try {
    const parsed = new URL(url)
    const domain = parsed.hostname

    const list: string[] = []

    // 1. Try site's own favicon first (works without proxy in China)
    list.push(`https://${domain}/favicon.ico`)

    // 2. Chrome extension favicon cache (works if previously visited)
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      list.push(
        `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`,
      )
    }

    // 3. DuckDuckGo, then Google only as a last-resort fallback. The tile's
    // onError advances sourceIndex, so Google is only contacted when every
    // earlier source failed — this limits how much of the user's bookmarked
    // domain set leaks to Google's favicon service.
    list.push(
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    )

    return list
  } catch {
    warn('Invalid URL for favicon sources')
    return []
  }
}

export function getInitial(title: string): string {
  return title.trim().charAt(0).toUpperCase() || '·'
}

// Muted, slightly desaturated system palette — less clash with wallpapers
const PALETTE = [
  '#C48A2A',
  '#C94B66',
  '#8E5FB8',
  '#3B7DD8',
  '#3BA55D',
  '#4A9BB8',
  '#5C5AB0',
  '#C45A52',
]

export function getColorFor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}
