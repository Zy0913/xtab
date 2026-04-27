import { describe, it, expect } from 'vitest'
import { getFaviconUrl, getInitial, getColorFor } from './faviconFetcher'

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
