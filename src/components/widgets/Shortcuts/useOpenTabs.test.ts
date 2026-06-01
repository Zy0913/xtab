import { describe, it, expect } from 'vitest'
import {
  normalizeUrlKey,
  isUsableTab,
  dedupByUrl,
  buildOpenTabs,
  groupTabsByWindow,
  type OpenTab,
} from './useOpenTabs'

function tab(partial: Partial<OpenTab> & { url: string }): OpenTab {
  return {
    id: 1,
    windowId: 1,
    title: 'Title',
    favIconUrl: undefined,
    isCurrentWindow: false,
    isActive: false,
    ...partial,
  }
}

describe('normalizeUrlKey', () => {
  it('strips a single trailing slash on root', () => {
    expect(normalizeUrlKey('https://github.com/')).toBe('https://github.com')
    expect(normalizeUrlKey('https://github.com')).toBe('https://github.com')
  })

  it('lowercases the host but preserves path case', () => {
    expect(normalizeUrlKey('https://GitHub.com/Anthropic')).toBe('https://github.com/Anthropic')
  })

  it('keeps query and hash', () => {
    expect(normalizeUrlKey('https://x.com/path/?a=1#h')).toBe('https://x.com/path?a=1#h')
  })

  it('falls back to a stable form on invalid URL', () => {
    expect(normalizeUrlKey('  not a url/  ')).toBe('not a url')
  })
})

describe('isUsableTab', () => {
  it('rejects tabs without an id or url', () => {
    expect(isUsableTab({ id: undefined, url: 'https://x.com' } as never)).toBe(false)
    expect(isUsableTab({ id: 1, url: undefined } as never)).toBe(false)
  })

  it('rejects internal protocols', () => {
    const cases = [
      'chrome://settings',
      'chrome-extension://abc/page.html',
      'devtools://devtools/inspector.html',
      'about:blank',
      'file:///Users/me/notes.md',
      'view-source:https://example.com',
    ]
    for (const url of cases) {
      expect(isUsableTab({ id: 1, url } as never)).toBe(false)
    }
  })

  it('rejects negative tab ids (TAB_ID_NONE)', () => {
    expect(isUsableTab({ id: -1, url: 'https://x.com' } as never)).toBe(false)
  })

  it('accepts http(s) tabs', () => {
    expect(isUsableTab({ id: 1, url: 'https://x.com/' } as never)).toBe(true)
    expect(isUsableTab({ id: 1, url: 'http://localhost:3000' } as never)).toBe(true)
  })
})

describe('dedupByUrl', () => {
  it('treats trailing-slash variants as the same URL', () => {
    const out = dedupByUrl([
      tab({ url: 'https://github.com', title: 'GitHub' }),
      tab({ url: 'https://github.com/', title: 'GitHub Home' }),
    ])
    expect(out).toHaveLength(1)
    // longer title wins
    expect(out[0].title).toBe('GitHub Home')
  })

  it('prefers the longer title regardless of which window', () => {
    const out = dedupByUrl([
      tab({ url: 'https://x.com', title: 'X — long descriptive title', isCurrentWindow: false }),
      tab({ url: 'https://x.com', title: 'X', isCurrentWindow: true }),
    ])
    expect(out[0].title).toBe('X — long descriptive title')
  })

  it('breaks ties using current-window when titles are equal length', () => {
    const out = dedupByUrl([
      tab({ url: 'https://x.com', title: 'XYZ', isCurrentWindow: false }),
      tab({ url: 'https://x.com', title: 'ABC', isCurrentWindow: true }),
    ])
    expect(out[0].isCurrentWindow).toBe(true)
  })
})

describe('buildOpenTabs', () => {
  it('filters internal tabs and dedupes by canonical URL', () => {
    const raw = [
      { id: 1, windowId: 10, title: 'Real', url: 'https://x.com/', active: true },
      { id: 2, windowId: 10, title: 'Real (longer)', url: 'https://x.com', active: false },
      { id: 3, windowId: 10, title: 'Settings', url: 'chrome://settings', active: false },
    ] as unknown as chrome.tabs.Tab[]
    const out = buildOpenTabs(raw, 10)
    expect(out).toHaveLength(1)
    expect(out[0].title).toBe('Real (longer)')
    expect(out[0].isCurrentWindow).toBe(true)
  })

  it('drops a chrome-favicon icon URL', () => {
    const raw = [
      {
        id: 1,
        windowId: 10,
        title: 'X',
        url: 'https://x.com/',
        active: false,
        favIconUrl: 'chrome://favicon/https://x.com',
      },
    ] as unknown as chrome.tabs.Tab[]
    const out = buildOpenTabs(raw, 10)
    expect(out[0].favIconUrl).toBeUndefined()
  })

  it('falls back to hostname when title is empty', () => {
    const raw = [
      { id: 1, windowId: 10, title: '   ', url: 'https://example.com/', active: false },
    ] as unknown as chrome.tabs.Tab[]
    const out = buildOpenTabs(raw, 10)
    expect(out[0].title).toBe('example.com')
  })
})

describe('groupTabsByWindow', () => {
  it('puts the current window first', () => {
    const out = groupTabsByWindow([
      tab({ id: 1, windowId: 200, isCurrentWindow: false, url: 'https://a.com' }),
      tab({ id: 2, windowId: 100, isCurrentWindow: true, url: 'https://b.com' }),
      tab({ id: 3, windowId: 200, isCurrentWindow: false, url: 'https://c.com' }),
    ])
    expect(out.map((g) => g.windowId)).toEqual([100, 200])
    expect(out[0].isCurrent).toBe(true)
    expect(out[1].tabs).toHaveLength(2)
  })
})
