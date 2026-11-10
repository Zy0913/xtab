import { warn } from '@/lib/logger'

/** Hosts that have no public favicon (or whose origin ico is a guaranteed miss). */
export function isPrivateIconHost(host: string): boolean {
  if (!host) return true
  if (host === 'localhost' || host.endsWith('.localhost')) return true
  // IPv4 / IPv6 — origin /favicon.ico is usually closed or CORP-blocked,
  // and icon CDNs have nothing useful to return.
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return true
  if (host.includes(':')) return true
  return false
}

export function getFaviconUrl(targetUrl: string): string {
  try {
    const domain = new URL(targetUrl).hostname
    if (isPrivateIconHost(domain)) return ''
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
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

    // Chrome's cached icon first — same-origin to the extension, so it
    // bypasses CORP/CORS. Sites like claude.ai return 200 +
    // Cross-Origin-Resource-Policy: same-origin on /favicon.ico, which
    // logs ERR_BLOCKED_BY_RESPONSE when used as a page <img>.
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      list.push(
        `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`,
      )
    }

    // Never request https://{host}/favicon.ico from the page. Dead IPs
    // (ERR_CONNECTION_CLOSED), redirect loops (ERR_TOO_MANY_REDIRECTS),
    // and CORP all show up as red console errors even when we fall back.

    if (!isPrivateIconHost(domain)) {
      // Google s2 almost always returns 200 (even a generic globe). DDG
      // 404s unknown hosts while still serving a placeholder PNG, which
      // paints AND logs Failed to load resource — onError never fires.
      list.push(
        `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      )
    }

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
