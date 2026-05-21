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
    return [
      `chrome://favicon2/?size=32&pageUrl=${encodeURIComponent(url)}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    ]
  } catch {
    warn('Invalid URL for favicon sources')
    return []
  }
}

export function getInitial(title: string): string {
  return title.trim().charAt(0).toUpperCase() || '·'
}

const PALETTE = [
  '#FF9F0A', '#FF375F', '#BF5AF2', '#0A84FF',
  '#30D158', '#64D2FF', '#5E5CE6', '#FF453A',
]

export function getColorFor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}
