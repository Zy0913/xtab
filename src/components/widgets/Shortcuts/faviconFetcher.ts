export function getFaviconUrl(targetUrl: string, size = 64): string {
  try {
    const domain = new URL(targetUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
  } catch {
    console.debug('Invalid URL for favicon')
    return ''
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
