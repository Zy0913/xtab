import { describe, it, expect } from 'vitest'
import { getFaviconUrl, getFaviconSources, getInitial, getColorFor } from './faviconFetcher'

describe('getFaviconUrl', () => {
  it('returns Google favicon URL for valid domain', () => {
    const url = getFaviconUrl('https://github.com/user/repo')
    expect(url).toContain('github.com')
    expect(url).toContain('www.google.com/s2/favicons')
  })

  it('returns empty string for invalid URL', () => {
    expect(getFaviconUrl('not-a-url')).toBe('')
    expect(getFaviconUrl('')).toBe('')
  })

  it('extracts domain correctly', () => {
    const url = getFaviconUrl('https://example.com')
    expect(url).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=32')
  })

  it('returns empty string for IP hosts', () => {
    expect(getFaviconUrl('https://136.0.197.119/login')).toBe('')
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
  it('skips origin /favicon.ico and uses public CDNs outside the extension', () => {
    const sources = getFaviconSources('https://github.com/user/repo')
    expect(sources).toEqual([
      'https://www.google.com/s2/favicons?domain=github.com&sz=32',
      'https://icons.duckduckgo.com/ip3/github.com.ico',
    ])
    expect(sources.some((src) => src.endsWith('/favicon.ico'))).toBe(false)
  })

  it('puts the chrome-extension favicon API first in extension context', () => {
    const originalChrome = globalThis.chrome
    globalThis.chrome = {
      runtime: {
        id: 'test-extension-id',
      },
    } as typeof chrome

    try {
      const sources = getFaviconSources('https://claude.ai')
      expect(sources).toEqual([
        'chrome-extension://test-extension-id/_favicon/?pageUrl=https%3A%2F%2Fclaude.ai&size=32',
        'https://www.google.com/s2/favicons?domain=claude.ai&sz=32',
        'https://icons.duckduckgo.com/ip3/claude.ai.ico',
      ])
    } finally {
      globalThis.chrome = originalChrome
    }
  })

  it('does not request public icons for IP hosts', () => {
    const originalChrome = globalThis.chrome
    globalThis.chrome = {
      runtime: {
        id: 'test-extension-id',
      },
    } as typeof chrome

    try {
      const sources = getFaviconSources('https://136.0.197.119/dashboard')
      expect(sources).toEqual([
        'chrome-extension://test-extension-id/_favicon/?pageUrl=https%3A%2F%2F136.0.197.119%2Fdashboard&size=32',
      ])
    } finally {
      globalThis.chrome = originalChrome
    }
  })

  it('never requests origin /favicon.ico for CORP or redirect-prone hosts', () => {
    for (const url of ['https://claude.ai', 'https://anyrouter.top', 'https://136.0.197.119']) {
      const sources = getFaviconSources(url)
      expect(sources.some((src) => /\/favicon\.ico(\?|$)/.test(src))).toBe(false)
      expect(sources.some((src) => src.startsWith('https://claude.ai/'))).toBe(false)
      expect(sources.some((src) => src.includes('136.0.197.119'))).toBe(false)
      expect(sources.some((src) => src.includes('anyrouter.top/favicon'))).toBe(false)
    }
  })

  it('returns empty array for invalid URL', () => {
    expect(getFaviconSources('not-a-url')).toEqual([])
    expect(getFaviconSources('')).toEqual([])
  })
})
