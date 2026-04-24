import type { SearchEngine } from '@/store/useSettingsStore'

const MAX_SUGGESTIONS = 8

interface EngineMeta {
  id: SearchEngine
  name: string
  placeholder: string
  searchUrl: (q: string) => string
  suggestUrl?: (q: string) => string
  parseSuggest?: (data: unknown) => string[]
  host: string
}

function openSearchParser(data: unknown): string[] {
  if (Array.isArray(data) && Array.isArray(data[1])) return data[1].slice(0, MAX_SUGGESTIONS)
  return []
}

// Strip JSONP wrappers like `cb({...})` or `window.baidu.sug({...})` so the
// payload can be fed to JSON.parse. Returns the original text when no wrapper
// is detected.
function unwrapJsonp(text: string): string {
  const trimmed = text.trim()
  const firstBrace = trimmed.indexOf('{')
  const firstBracket = trimmed.indexOf('[')
  const start =
    firstBrace === -1 ? firstBracket
    : firstBracket === -1 ? firstBrace
    : Math.min(firstBrace, firstBracket)
  if (start <= 0) return trimmed
  const lastBrace = trimmed.lastIndexOf('}')
  const lastBracket = trimmed.lastIndexOf(']')
  const end = Math.max(lastBrace, lastBracket)
  if (end <= start) return trimmed
  return trimmed.slice(start, end + 1)
}

export const ENGINES: Record<SearchEngine, EngineMeta> = {
  google: {
    id: 'google',
    name: 'Google',
    placeholder: 'Google 搜索',
    searchUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    suggestUrl: (q) =>
      `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}`,
    host: 'google.com',
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    placeholder: '必应搜索',
    searchUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    suggestUrl: (q) =>
      `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(q)}`,
    host: 'bing.com',
  },
  baidu: {
    id: 'baidu',
    name: '百度',
    placeholder: '百度搜索',
    searchUrl: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
    suggestUrl: (q) =>
      `https://www.baidu.com/sugrec?prod=pc&from=pc_web&wd=${encodeURIComponent(q)}`,
    parseSuggest: (data) => {
      if (typeof data === 'object' && data !== null && Array.isArray((data as Record<string, unknown>).g)) {
        return ((data as Record<string, unknown>).g as Array<{ q?: unknown }>)
          .filter((item) => typeof item.q === 'string')
          .map((item) => item.q as string)
          .slice(0, MAX_SUGGESTIONS)
      }
      return []
    },
    host: 'baidu.com',
  },
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    placeholder: 'DuckDuckGo',
    searchUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    suggestUrl: (q) =>
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
    host: 'duckduckgo.com',
  },
}

export async function fetchSuggestions(
  engine: SearchEngine,
  query: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const meta = ENGINES[engine]
  if (!meta.suggestUrl || !query.trim()) return []
  try {
    const res = await fetch(meta.suggestUrl(query), { signal })
    if (!res.ok) return []
    // Read as text so we can handle JSONP-wrapped payloads (baidu sometimes
    // returns `window.baidu.sug({...})` even without an explicit `cb` param).
    const text = await res.text()
    const data = JSON.parse(unwrapJsonp(text))
    return meta.parseSuggest ? meta.parseSuggest(data) : openSearchParser(data)
  } catch {
    console.debug('Suggestion fetch failed')
    return []
  }
}
