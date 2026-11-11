/**
 * Turns what was typed into the address field into a link: an address with no
 * scheme gets https://.
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** "(3) YouTube": the unread count a page puts before its title. */
const COUNTER = /^[([]\d+\+?[)\]]\s*/
/** Between the parts of a title: "Page - Site", "Site | Slogan", "Home / X". */
const SPACED_SEPARATOR = /\s+[-–—|·•/»›]\s+|\s*｜\s*/
/** Tighter separators ("哔哩哔哩_bilibili", "Figma: …") also join words, so a
 *  part they cut off is only kept when it names the site. */
const TIGHT_SEPARATOR = /\s*[:：_|·•–—-]\s*/

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isHomePage(url: string): boolean {
  try {
    const { pathname } = new URL(url)
    return pathname === '' || pathname === '/'
  } catch {
    return false
  }
}

/** How a title might spell the site: "linux.do" gives linux and linuxdo. */
function siteSpellings(host: string): Set<string> {
  const labels = host.split('.').filter(Boolean)
  const named = labels.length > 1 ? labels.slice(0, -1) : labels
  return new Set([...named, named.join(''), labels.join('')])
}

/** "LINUX DO" and "linux.do" both become linuxdo. */
function squash(text: string): string {
  return text.toLowerCase().replace(/[\s.\-_'’]/g, '')
}

/**
 * A short name for a shortcut made from an open tab. A page title puts a
 * slogan or the page's own name next to the site's ("LINUX DO - 新的理想型社区",
 * "Dashboard | Vercel"), and a tile has room for a word or two, so the part
 * that names the site is kept. When no part does, a home page keeps its first
 * part (sites lead with their name there) and any other page its last
 * ("如何评价… - 知乎").
 */
export function suggestShortcutName(title: string, url: string): string {
  const host = hostOf(url)
  const clean = title.trim().replace(COUNTER, '').trim()
  if (!clean) return host || title.trim()

  const spellings = siteSpellings(host)
  const namesSite = (part: string) => {
    const squashed = squash(part)
    return squashed !== '' && spellings.has(squashed)
  }
  const split = (separator: RegExp) =>
    clean
      .split(separator)
      .map((part) => part.trim())
      .filter(Boolean)

  const parts = split(SPACED_SEPARATOR)
  if (parts.length > 1) {
    return parts.find(namesSite) ?? (isHomePage(url) ? parts[0] : parts[parts.length - 1])
  }
  const pieces = split(TIGHT_SEPARATOR)
  return (pieces.length > 1 && pieces.find(namesSite)) || clean
}
