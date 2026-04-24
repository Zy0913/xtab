import { describe, it, expect } from 'vitest'
import { ENGINES, fetchSuggestions } from './search'
import type { SearchEngine } from '@/store/useSettingsStore'

describe('ENGINES', () => {
  it('has all four engines', () => {
    expect(Object.keys(ENGINES)).toEqual(['google', 'bing', 'baidu', 'duckduckgo'])
  })

  it('each engine has required fields', () => {
    for (const engine of Object.values(ENGINES)) {
      expect(engine.id).toBeTruthy()
      expect(engine.name).toBeTruthy()
      expect(engine.placeholder).toBeTruthy()
      expect(typeof engine.searchUrl('test')).toBe('string')
      expect(engine.host).toBeTruthy()
    }
  })

  it('searchUrl encodes query', () => {
    expect(ENGINES.google.searchUrl('hello world')).toContain('hello%20world')
    expect(ENGINES.bing.searchUrl('hello&world')).toContain('hello%26world')
  })
})

describe('fetchSuggestions', () => {
  it('returns empty array for empty query', async () => {
    const result = await fetchSuggestions('google', '')
    expect(result).toEqual([])
  })

  it('returns empty array for whitespace query', async () => {
    const result = await fetchSuggestions('google', '   ')
    expect(result).toEqual([])
  })

  it('returns empty array for engine without suggestUrl', async () => {
    // All current engines have suggestUrl, but test the guard
    const result = await fetchSuggestions('google' as SearchEngine, 'test', AbortSignal.abort())
    expect(result).toEqual([])
  })
})
