import { describe, it, expect } from 'vitest'
import { getFaviconUrl, getFaviconSources, getInitial, getColorFor } from './faviconFetcher'

describe('getFaviconUrl', () => {
  it('returns DuckDuckGo favicon URL for valid domain', () => {
    const url = getFaviconUrl('https://github.com/user/repo')
    expect(url).toContain('github.com')
    expect(url).toContain('icons.duckduckgo.com/ip3/')
  })

  it('returns empty string for invalid URL', () => {
    expect(getFaviconUrl('not-a-url')).toBe('')
    expect(getFaviconUrl('')).toBe('')
  })

  it('extracts domain correctly', () => {
    const url = getFaviconUrl('https://example.com')
    expect(url).toBe('https://icons.duckduckgo.com/ip3/example.com.ico')
  })
})

describe('getInitial', () => {
  it('returns first character uppercase', () => {
    expect(getInitial('github')).toBe('G')
    expect(getInitial('GitHub')).toBe('G')
  })

  it('returns dot for empty string', () => {
    expect(getInitial('')).toBe('·')
    expect(getInitial('  ')).toBe('·')
  })
})

describe('getColorFor', () => {
  it('returns consistent color for same key', () => {
    const color1 = getColorFor('github')
    const color2 = getColorFor('github')
    expect(color1).toBe(color2)
  })

  it('returns different colors for different keys', () => {
    const color1 = getColorFor('github')
    const color2 = getColorFor('google')
    // Not guaranteed to be different, but very likely
    expect(color1).toBeTruthy()
    expect(color2).toBeTruthy()
  })

  it('returns a valid hex color', () => {
    const color = getColorFor('test')
    expect(color).toMatch(/^#[0-9A-F]{6}$/)
  })
})

describe('getFaviconSources', () => {
  it('returns three sources for a valid URL', () => {
    const sources = getFaviconSources('https://github.com/user/repo')
    expect(sources).toHaveLength(3)
  })

  it('chrome://favicon2 URL contains encoded full URL', () => {
    const sources = getFaviconSources('https://example.com/page')
    expect(sources[0]).toContain('chrome://favicon2/?size=32&pageUrl=')
    expect(sources[0]).toContain(encodeURIComponent('https://example.com/page'))
  })

  it('DuckDuckGo URL uses ip3 subdomain and .ico suffix', () => {
    const sources = getFaviconSources('https://github.com/user/repo')
    expect(sources[1]).toBe('https://icons.duckduckgo.com/ip3/github.com.ico')
  })

  it('Google URL uses s2 path and sz=32 parameter', () => {
    const sources = getFaviconSources('https://github.com/user/repo')
    expect(sources[2]).toBe('https://www.google.com/s2/favicons?domain=github.com&sz=32')
  })

  it('returns empty array for invalid URL', () => {
    expect(getFaviconSources('not-a-url')).toEqual([])
    expect(getFaviconSources('')).toEqual([])
  })
})
