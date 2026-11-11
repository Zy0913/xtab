/**
 * Keeps random wallpapers from coming back too soon.
 *
 * Every wallpaper put on screen is noted here, newest last. A random pick
 * prefers pictures that aren't on the list; once a source has shown all it
 * has, it goes to the ones shown longest ago.
 *
 * The list lives in localStorage: synchronous and shared by every open new
 * tab. Losing it only means picks start afresh.
 */

const STORAGE_KEY = 'tab:recent-wallpapers'

/** How many wallpapers are remembered: more than Bing (15) or a short
    toplist holds, fewer than the long toplists. */
export const RECENT_WALLPAPER_LIMIT = 100

/** Anything longer is an upload (a data URL): never picked at random and
    too big to keep. */
const MAX_URL_LENGTH = 2048

/** The same Bing picture comes from www.bing.com or cn.bing.com, whichever
    answered; both count as one. */
export function wallpaperKey(url: string): string {
  return url.replace(/^https:\/\/cn\.bing\.com\//i, 'https://www.bing.com/')
}

/** Wallpapers shown lately, oldest first. */
export function recentWallpapers(): string[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Notes that a wallpaper went on screen. */
export function rememberWallpaper(url: string): void {
  if (!url || url.length > MAX_URL_LENGTH || /^(data|blob):/i.test(url)) return
  const key = wallpaperKey(url)
  const list = recentWallpapers().filter((x) => x !== key)
  list.push(key)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-RECENT_WALLPAPER_LIMIT)))
  } catch {
    // Storage unavailable or full: picks just start afresh.
  }
}

/**
 * Picks at random among the items whose wallpaper isn't in `recent`. When
 * all of them are, picks among the half shown longest ago, so a picture
 * comes back only after at least half of the others have been shown since.
 */
export function pickFresh<T>(
  items: readonly T[],
  urlOf: (item: T) => string,
  recent: readonly string[],
): T | null {
  const shownAt = new Map<string, number>(recent.map((url, i) => [wallpaperKey(url), i]))
  const lastShown = (item: T) => shownAt.get(wallpaperKey(urlOf(item))) ?? -1
  const fresh = items.filter((item) => lastShown(item) < 0)
  const pool = fresh.length
    ? fresh
    : [...items].sort((a, b) => lastShown(a) - lastShown(b)).slice(0, Math.ceil(items.length / 2))
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
}
