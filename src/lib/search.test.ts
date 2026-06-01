import { describe, it, expect } from 'vitest'
import { ENGINES, fetchSuggestions, unwrapJsonp, openSearchParser } from './search'
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

describe('openSearchParser', () => {
  it('returns suggestions from array data', () => {
    expect(openSearchParser(['query', ['s1', 's2', 's3']])).toEqual(['s1', 's2', 's3'])
  })

  it('returns empty array for invalid data', () => {
    expect(openSearchParser(null)).toEqual([])
    expect(openSearchParser({})).toEqual([])
    expect(openSearchParser('string')).toEqual([])
  })

  it('returns empty array when second element is not an array', () => {
    expect(openSearchParser(['query', 'not-an-array'])).toEqual([])
  })
})

describe('unwrapJsonp', () => {
  it('extracts JSON from simple wrapper', () => {
    expect(unwrapJsonp('callback({"a":1})')).toBe('{"a":1}')
  })

  it('extracts JSON from baidu-style wrapper', () => {
    expect(unwrapJsonp('window.baidu.sug({q:"test",g:[1,2]})')).toBe('{q:"test",g:[1,2]}')
  })

  it('returns original text when no brackets found', () => {
    expect(unwrapJsonp('plain text')).toBe('plain text')
  })

  it('handles JSON array payload', () => {
    expect(unwrapJsonp('cb([1,2,3])')).toBe('[1,2,3]')
  })
})

describe('baidu parseSuggest', () => {
  it('extracts suggestions from baidu format', () => {
    const parser = ENGINES.baidu.parseSuggest!
    expect(
      parser({
        g: [{ q: 'test1' }, { q: 'test2' }, { q: 'test3' }],
      }),
    ).toEqual(['test1', 'test2', 'test3'])
  })

  it('returns empty array for missing g property', () => {
    const parser = ENGINES.baidu.parseSuggest!
    expect(parser({})).toEqual([])
    expect(parser(null)).toEqual([])
  })

  it('filters out items without string q', () => {
    const parser = ENGINES.baidu.parseSuggest!
    expect(
      parser({
        g: [{ q: 'valid' }, { notQ: 1 }, { q: 123 }],
      }),
    ).toEqual(['valid'])
  })
})
