import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  RECENT_WALLPAPER_LIMIT,
  pickFresh,
  recentWallpapers,
  rememberWallpaper,
  wallpaperKey,
} from './recentWallpapers'

const same = (url: string) => url
const bingDay = (i: number) => `https://www.bing.com/th?id=OHR.Day${i}_1920x1080.jpg`

/** Clicks "random" `clicks` times over a fixed pool; returns what was shown. */
function clickThrough(pool: string[], clicks: number) {
  const shown: string[] = []
  for (let i = 0; i < clicks; i++) {
    const pick = pickFresh(pool, same, recentWallpapers())!
    rememberWallpaper(pick)
    shown.push(pick)
  }
  return shown
}

/** The shortest run of clicks between two showings of the same picture. */
function shortestGap(shown: string[]) {
  const lastAt = new Map<string, number>()
  let gap = Infinity
  shown.forEach((url, i) => {
    const prev = lastAt.get(url)
    if (prev !== undefined) gap = Math.min(gap, i - prev)
    lastAt.set(url, i)
  })
  return gap
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('pickFresh', () => {
  it('never picks a picture shown lately while others remain', () => {
    for (const r of [0, 0.4, 0.999]) {
      vi.spyOn(Math, 'random').mockReturnValue(r)
      expect(['c', 'd']).toContain(pickFresh(['a', 'b', 'c', 'd'], same, ['b', 'a']))
    }
  })

  it('once all were shown, picks among the half shown longest ago', () => {
    const recent = ['c', 'a', 'f', 'b', 'e', 'd'] // oldest first
    const picks = new Set<string>()
    for (const r of [0, 0.34, 0.67, 0.999]) {
      vi.spyOn(Math, 'random').mockReturnValue(r)
      picks.add(pickFresh(['a', 'b', 'c', 'd', 'e', 'f'], same, recent)!)
    }
    expect([...picks].sort()).toEqual(['a', 'c', 'f'])
  })

  it('counts the same Bing picture from either host as one', () => {
    const cn = 'https://cn.bing.com/th?id=OHR.Day0_1920x1080.jpg'
    expect(wallpaperKey(cn)).toBe(bingDay(0))
    expect(pickFresh([cn, bingDay(1)], same, [bingDay(0)])).toBe(bingDay(1))
  })

  it('returns null for an empty pool', () => {
    expect(pickFresh([], same, ['a'])).toBeNull()
  })
})

describe('clicking through', () => {
  it('shows all 15 Bing days before any comes back, then keeps repeats apart', () => {
    const pool = Array.from({ length: 15 }, (_, i) => bingDay(i))
    const shown = clickThrough(pool, 300)
    expect(new Set(shown.slice(0, 15)).size).toBe(15)
    // Only the older half is ever drawn, so 7 others always come in between.
    expect(shortestGap(shown)).toBeGreaterThanOrEqual(8)
  })

  it('brings nothing back from a long toplist within the remembered stretch', () => {
    const pool = Array.from({ length: 144 }, (_, i) => `https://w.wallhaven.cc/full/x/${i}.jpg`)
    expect(shortestGap(clickThrough(pool, 400))).toBeGreaterThan(RECENT_WALLPAPER_LIMIT)
  })
})

describe('rememberWallpaper', () => {
  it('keeps the newest last, once each, up to the limit', () => {
    rememberWallpaper('a')
    rememberWallpaper('b')
    rememberWallpaper('a')
    expect(recentWallpapers()).toEqual(['b', 'a'])

    for (let i = 0; i < RECENT_WALLPAPER_LIMIT + 10; i++) rememberWallpaper(`u${i}`)
    const list = recentWallpapers()
    expect(list).toHaveLength(RECENT_WALLPAPER_LIMIT)
    expect(list.at(-1)).toBe(`u${RECENT_WALLPAPER_LIMIT + 9}`)
  })

  it('stores Bing pictures under one host', () => {
    rememberWallpaper('https://cn.bing.com/th?id=OHR.Day3_1920x1080.jpg')
    expect(recentWallpapers()).toEqual([bingDay(3)])
  })

  it('skips uploads', () => {
    rememberWallpaper('data:image/png;base64,AAAA')
    rememberWallpaper('blob:chrome-extension://id/123')
    rememberWallpaper('')
    expect(recentWallpapers()).toEqual([])
  })

  it('starts afresh when the stored list is unreadable', () => {
    localStorage.setItem('tab:recent-wallpapers', '{oops')
    expect(recentWallpapers()).toEqual([])
    rememberWallpaper('a')
    expect(recentWallpapers()).toEqual(['a'])
  })
})
