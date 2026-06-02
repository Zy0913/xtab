import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isStr,
  isNum,
  isBool,
  isObj,
  parseLayouts,
  parseEnabled,
  parseSettings,
  parseShortcuts,
  parseTodos,
  MAX_IMPORT_SIZE,
  SUPPORTED_VERSIONS,
  VALID_THEMES,
  VALID_ENGINES,
  VALID_GLASS,
} from './useBackupRestore'

// ---------------------------------------------------------------------------
// Store mocks – zustand static API (getState / setState)
// vi.hoisted ensures these are available when vi.mock factories run.
// ---------------------------------------------------------------------------

const { layoutSetState, settingsSetState, shortcutsSetState, todoSetState } = vi.hoisted(() => ({
  layoutSetState: vi.fn(),
  settingsSetState: vi.fn(),
  shortcutsSetState: vi.fn(),
  todoSetState: vi.fn(),
}))

vi.mock('@/store/useLayoutStore', () => ({
  useLayoutStore: {
    getState: () => ({
      layouts: [],
      enabled: [],
    }),
    setState: layoutSetState,
  },
}))

vi.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: {
    getState: () => ({
      theme: 'system',
      glassMode: 'sequoia',
      searchEngine: 'google',
      wallpaper: '',
      wallpaperTint: null,
      wallpaperLuminance: null,
      wallpaperDimming: 0.25,
      reduceMotion: false,
    }),
    setState: settingsSetState,
  },
}))

vi.mock('@/store/useShortcutsStore', () => ({
  useShortcutsStore: {
    getState: () => ({ items: [] }),
    setState: shortcutsSetState,
  },
}))

vi.mock('@/store/useTodoStore', () => ({
  useTodoStore: {
    getState: () => ({ items: [] }),
    setState: todoSetState,
  },
}))

vi.mock('@/lib/toast', () => ({ showToast: vi.fn() }))

// Import after mocks
import { useBackupRestore } from './useBackupRestore'
import { showToast } from '@/lib/toast'
import { renderHook, act } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

describe('isStr', () => {
  it('returns true for strings', () => {
    expect(isStr('hello')).toBe(true)
    expect(isStr('')).toBe(true)
  })

  it('returns false for non-strings', () => {
    expect(isStr(123)).toBe(false)
    expect(isStr(null)).toBe(false)
    expect(isStr(undefined)).toBe(false)
    expect(isStr({})).toBe(false)
    expect(isStr(true)).toBe(false)
  })
})

describe('isNum', () => {
  it('returns true for finite numbers', () => {
    expect(isNum(0)).toBe(true)
    expect(isNum(42)).toBe(true)
    expect(isNum(-3.14)).toBe(true)
  })

  it('returns false for NaN and Infinity', () => {
    expect(isNum(NaN)).toBe(false)
    expect(isNum(Infinity)).toBe(false)
    expect(isNum(-Infinity)).toBe(false)
  })

  it('returns false for non-numbers', () => {
    expect(isNum('42')).toBe(false)
    expect(isNum(null)).toBe(false)
    expect(isNum(undefined)).toBe(false)
  })
})

describe('isBool', () => {
  it('returns true for booleans', () => {
    expect(isBool(true)).toBe(true)
    expect(isBool(false)).toBe(true)
  })

  it('returns false for non-booleans', () => {
    expect(isBool(0)).toBe(false)
    expect(isBool(1)).toBe(false)
    expect(isBool('true')).toBe(false)
    expect(isBool(null)).toBe(false)
  })
})

describe('isObj', () => {
  it('returns true for plain objects', () => {
    expect(isObj({})).toBe(true)
    expect(isObj({ a: 1 })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isObj(null)).toBe(false)
  })

  it('returns false for arrays', () => {
    expect(isObj([])).toBe(false)
    expect(isObj([1, 2])).toBe(false)
  })

  it('returns false for primitives', () => {
    expect(isObj('str')).toBe(false)
    expect(isObj(42)).toBe(false)
    expect(isObj(true)).toBe(false)
    expect(isObj(undefined)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// parseLayouts
// ---------------------------------------------------------------------------

describe('parseLayouts', () => {
  it('returns valid layouts array', () => {
    const input = [
      { i: 'search', x: 0, y: 0, w: 12, h: 1 },
      { i: 'clock', x: 0, y: 1, w: 12, h: 3 },
    ]
    expect(parseLayouts(input)).toEqual(input)
  })

  it('accepts all valid widget ids', () => {
    const ids = ['search', 'clock', 'shortcuts', 'weather', 'todo', 'bookmarks']
    const input = ids.map((id, idx) => ({ i: id, x: 0, y: idx, w: 4, h: 3 }))
    expect(parseLayouts(input)).toHaveLength(6)
  })

  it('throws for non-array input', () => {
    expect(() => parseLayouts('not array')).toThrow('layouts 格式错误')
    expect(() => parseLayouts(null)).toThrow('layouts 格式错误')
    expect(() => parseLayouts({})).toThrow('layouts 格式错误')
  })

  it('throws for invalid widget id', () => {
    expect(() => parseLayouts([{ i: 'unknown', x: 0, y: 0, w: 1, h: 1 }])).toThrow(
      '非法 widget id: unknown',
    )
  })

  it('throws for missing widget id', () => {
    expect(() => parseLayouts([{ x: 0, y: 0, w: 1, h: 1 }])).toThrow('非法 widget id')
  })

  it('throws for missing coordinates', () => {
    expect(() => parseLayouts([{ i: 'search', y: 0, w: 1, h: 1 }])).toThrow('layouts 坐标格式错误')
    expect(() => parseLayouts([{ i: 'search', x: 0, w: 1, h: 1 }])).toThrow('layouts 坐标格式错误')
  })

  it('throws for non-numeric coordinates', () => {
    expect(() => parseLayouts([{ i: 'search', x: 'a', y: 0, w: 1, h: 1 }])).toThrow(
      'layouts 坐标格式错误',
    )
  })
})

// ---------------------------------------------------------------------------
// parseEnabled
// ---------------------------------------------------------------------------

describe('parseEnabled', () => {
  it('returns valid widget id array', () => {
    const input = ['search', 'clock', 'weather']
    expect(parseEnabled(input)).toEqual(input)
  })

  it('accepts empty array', () => {
    expect(parseEnabled([])).toEqual([])
  })

  it('throws for non-array input', () => {
    expect(() => parseEnabled('search')).toThrow('enabled 格式错误')
    expect(() => parseEnabled(null)).toThrow('enabled 格式错误')
    expect(() => parseEnabled({})).toThrow('enabled 格式错误')
  })

  it('throws for unknown widget id', () => {
    expect(() => parseEnabled(['search', 'invalid_widget'])).toThrow(
      '非法 widget id: invalid_widget',
    )
  })
})

// ---------------------------------------------------------------------------
// parseSettings
// ---------------------------------------------------------------------------

describe('parseSettings', () => {
  it('returns parsed object for valid partial settings', () => {
    const result = parseSettings({ theme: 'dark', searchEngine: 'bing' })
    expect(result).toEqual(expect.objectContaining({ theme: 'dark', searchEngine: 'bing' }))
  })

  it('returns empty-ish object for empty input', () => {
    const result = parseSettings({})
    expect(result).toBeDefined()
    expect(result.theme).toBeUndefined()
    expect(result.searchEngine).toBeUndefined()
  })

  it('throws for non-object input', () => {
    expect(() => parseSettings('string')).toThrow('settings 格式错误')
    expect(() => parseSettings(null)).toThrow('settings 格式错误')
    expect(() => parseSettings([])).toThrow('settings 格式错误')
  })

  it('throws for invalid theme', () => {
    expect(() => parseSettings({ theme: 'neon' })).toThrow('非法 theme: neon')
  })

  it('accepts all valid themes', () => {
    for (const theme of VALID_THEMES) {
      const result = parseSettings({ theme })
      expect(result.theme).toBe(theme)
    }
  })

  it('throws for invalid searchEngine', () => {
    expect(() => parseSettings({ searchEngine: 'yahoo' })).toThrow('非法 searchEngine: yahoo')
  })

  it('accepts all valid search engines', () => {
    for (const engine of VALID_ENGINES) {
      const result = parseSettings({ searchEngine: engine })
      expect(result.searchEngine).toBe(engine)
    }
  })

  it('throws for invalid glassMode', () => {
    expect(() => parseSettings({ glassMode: 'frosted' })).toThrow('非法 glassMode: frosted')
  })

  it('accepts all valid glass modes', () => {
    for (const glass of VALID_GLASS) {
      const result = parseSettings({ glassMode: glass })
      expect(result.glassMode).toBe(glass)
    }
  })

  it('throws for non-string wallpaper', () => {
    expect(() => parseSettings({ wallpaper: 123 })).toThrow('wallpaper 格式错误')
  })

  it('accepts string wallpaper', () => {
    const result = parseSettings({ wallpaper: 'https://example.com/bg.jpg' })
    expect(result.wallpaper).toBe('https://example.com/bg.jpg')
  })

  it('accepts null wallpaperTint', () => {
    const result = parseSettings({ wallpaperTint: null })
    expect(result.wallpaperTint).toBeNull()
  })

  it('throws for invalid wallpaperTint', () => {
    expect(() => parseSettings({ wallpaperTint: 123 })).toThrow('wallpaperTint 格式错误')
  })

  it('throws for wallpaperDimming below 0', () => {
    expect(() => parseSettings({ wallpaperDimming: -0.1 })).toThrow('wallpaperDimming 格式错误')
  })

  it('throws for wallpaperDimming above 0.6', () => {
    expect(() => parseSettings({ wallpaperDimming: 0.7 })).toThrow('wallpaperDimming 格式错误')
  })

  it('accepts wallpaperDimming at boundaries', () => {
    expect(parseSettings({ wallpaperDimming: 0 }).wallpaperDimming).toBe(0)
    expect(parseSettings({ wallpaperDimming: 0.6 }).wallpaperDimming).toBe(0.6)
    expect(parseSettings({ wallpaperDimming: 0.3 }).wallpaperDimming).toBe(0.3)
  })

  it('throws for non-boolean reduceMotion', () => {
    expect(() => parseSettings({ reduceMotion: 'yes' })).toThrow('reduceMotion 格式错误')
  })

  it('accepts boolean reduceMotion', () => {
    expect(parseSettings({ reduceMotion: true }).reduceMotion).toBe(true)
    expect(parseSettings({ reduceMotion: false }).reduceMotion).toBe(false)
  })

  // v3 -> v4 migration: wallpaperIsDark → wallpaperLuminance
  describe('wallpaperIsDark migration (v3 to v4)', () => {
    it('migrates wallpaperIsDark: true to wallpaperLuminance: 0.3', () => {
      const result = parseSettings({ wallpaperIsDark: true })
      expect(result.wallpaperLuminance).toBe(0.3)
    })

    it('migrates wallpaperIsDark: false to wallpaperLuminance: 0.7', () => {
      const result = parseSettings({ wallpaperIsDark: false })
      expect(result.wallpaperLuminance).toBe(0.7)
    })

    it('uses wallpaperLuminance when both are present', () => {
      const result = parseSettings({ wallpaperLuminance: 0.5, wallpaperIsDark: true })
      expect(result.wallpaperLuminance).toBe(0.5)
    })

    it('returns null luminance when wallpaperIsDark is neither true nor false', () => {
      const result = parseSettings({ wallpaperIsDark: null })
      // null !== true, so it goes to the else branch: 0.7
      expect(result.wallpaperLuminance).toBe(0.7)
    })
  })

  it('throws for non-numeric wallpaperLuminance', () => {
    expect(() => parseSettings({ wallpaperLuminance: 'dark' })).toThrow(
      'wallpaperLuminance 格式错误',
    )
  })

  it('accepts null wallpaperLuminance', () => {
    const result = parseSettings({ wallpaperLuminance: null })
    expect(result.wallpaperLuminance).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// parseShortcuts
// ---------------------------------------------------------------------------

describe('parseShortcuts', () => {
  it('returns valid shortcuts array', () => {
    const input = [
      { id: '1', title: 'Google', url: 'https://google.com' },
      { id: '2', title: 'GitHub', url: 'https://github.com' },
    ]
    expect(parseShortcuts(input)).toEqual(input)
  })

  it('accepts empty array', () => {
    expect(parseShortcuts([])).toEqual([])
  })

  it('throws for non-array input', () => {
    expect(() => parseShortcuts('nope')).toThrow('shortcuts 格式错误')
    expect(() => parseShortcuts(null)).toThrow('shortcuts 格式错误')
  })

  it('throws for missing id', () => {
    expect(() => parseShortcuts([{ title: 'Google', url: 'https://google.com' }])).toThrow(
      'shortcuts 条目格式错误',
    )
  })

  it('throws for missing title', () => {
    expect(() => parseShortcuts([{ id: '1', url: 'https://google.com' }])).toThrow(
      'shortcuts 条目格式错误',
    )
  })

  it('throws for missing url', () => {
    expect(() => parseShortcuts([{ id: '1', title: 'Google' }])).toThrow('shortcuts 条目格式错误')
  })

  it('throws for non-string fields', () => {
    expect(() => parseShortcuts([{ id: 1, title: 'Google', url: 'https://google.com' }])).toThrow(
      'shortcuts 条目格式错误',
    )
  })
})

// ---------------------------------------------------------------------------
// parseTodos
// ---------------------------------------------------------------------------

describe('parseTodos', () => {
  it('returns valid todos array', () => {
    const input = [
      { id: 't1', text: 'Buy groceries', done: false, createdAt: 1700000000000 },
      { id: 't2', text: 'Read book', done: true, createdAt: 1700000001000 },
    ]
    expect(parseTodos(input)).toEqual(input)
  })

  it('accepts empty array', () => {
    expect(parseTodos([])).toEqual([])
  })

  it('throws for non-array input', () => {
    expect(() => parseTodos('nope')).toThrow('todos 格式错误')
    expect(() => parseTodos(null)).toThrow('todos 格式错误')
  })

  it('throws for missing id', () => {
    expect(() => parseTodos([{ text: 'Buy', done: false, createdAt: 1700000000000 }])).toThrow(
      'todos 条目格式错误',
    )
  })

  it('throws for missing text', () => {
    expect(() => parseTodos([{ id: 't1', done: false, createdAt: 1700000000000 }])).toThrow(
      'todos 条目格式错误',
    )
  })

  it('throws for missing done', () => {
    expect(() => parseTodos([{ id: 't1', text: 'Buy', createdAt: 1700000000000 }])).toThrow(
      'todos 条目格式错误',
    )
  })

  it('throws for missing createdAt', () => {
    expect(() => parseTodos([{ id: 't1', text: 'Buy', done: false }])).toThrow('todos 条目格式错误')
  })

  it('throws for wrong types', () => {
    expect(() =>
      parseTodos([{ id: 1, text: 'Buy', done: false, createdAt: 1700000000000 }]),
    ).toThrow('todos 条目格式错误')
  })
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('MAX_IMPORT_SIZE is 5MB', () => {
    expect(MAX_IMPORT_SIZE).toBe(5 * 1024 * 1024)
  })

  it('SUPPORTED_VERSIONS contains 1-4', () => {
    expect(SUPPORTED_VERSIONS).toEqual([1, 2, 3, 4])
  })

  it('VALID_THEMES contains expected values', () => {
    expect(VALID_THEMES).toEqual(['light', 'dark', 'system'])
  })

  it('VALID_ENGINES contains expected values', () => {
    expect(VALID_ENGINES).toEqual(['google', 'bing', 'baidu', 'duckduckgo'])
  })

  it('VALID_GLASS contains expected values', () => {
    expect(VALID_GLASS).toEqual(['sequoia', 'tahoe'])
  })
})

// ---------------------------------------------------------------------------
// handleImport (integration via renderHook)
// ---------------------------------------------------------------------------

/** Build a minimal mock ChangeEvent<HTMLInputElement> with a single File */
function mockFileEvent(jsonContent: string | object, sizeOverride?: number) {
  const text = typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent)
  const blob = new Blob([text], { type: 'application/json' })
  // Override size if requested
  if (sizeOverride !== undefined) {
    Object.defineProperty(blob, 'size', { value: sizeOverride })
  }
  const file = new File([blob], 'backup.json', { type: 'application/json' })
  if (sizeOverride !== undefined) {
    Object.defineProperty(file, 'size', { value: sizeOverride })
  }

  const input = document.createElement('input')
  Object.defineProperty(input, 'files', { value: [file] })
  // Track value resets (the hook sets e.target.value = '' in finally)
  let value = ''
  Object.defineProperty(input, 'value', {
    get: () => value,
    set: (v: string) => {
      value = v
    },
  })

  return { currentTarget: input, target: input } as unknown as React.ChangeEvent<HTMLInputElement>
}

function mockEmptyEvent() {
  const input = document.createElement('input')
  Object.defineProperty(input, 'files', { value: [] })
  let value = ''
  Object.defineProperty(input, 'value', {
    get: () => value,
    set: (v: string) => {
      value = v
    },
  })
  return { currentTarget: input, target: input } as unknown as React.ChangeEvent<HTMLInputElement>
}

describe('handleImport', () => {
  beforeEach(() => {
    layoutSetState.mockClear()
    settingsSetState.mockClear()
    shortcutsSetState.mockClear()
    todoSetState.mockClear()
    vi.mocked(showToast).mockClear()
  })

  it('imports valid JSON and updates all stores', async () => {
    const payload = {
      version: 4,
      layouts: [{ i: 'search', x: 0, y: 0, w: 12, h: 1 }],
      enabled: ['search', 'clock'],
      settings: { theme: 'dark', searchEngine: 'bing' },
      shortcuts: [{ id: 's1', title: 'Google', url: 'https://google.com' }],
      todos: [{ id: 't1', text: 'Test', done: false, createdAt: 1700000000000 }],
    }

    const { result } = renderHook(() => useBackupRestore())

    await act(async () => {
      await result.current.handleImport(mockFileEvent(payload))
    })

    expect(layoutSetState).toHaveBeenCalledWith({ layouts: payload.layouts })
    expect(layoutSetState).toHaveBeenCalledWith({ enabled: payload.enabled })
    expect(settingsSetState).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }))
    expect(shortcutsSetState).toHaveBeenCalledWith({ items: payload.shortcuts })
    expect(todoSetState).toHaveBeenCalledWith({ items: payload.todos })
    expect(showToast).not.toHaveBeenCalled()
  })

  it('does nothing when no file is selected', async () => {
    const { result } = renderHook(() => useBackupRestore())

    await act(async () => {
      await result.current.handleImport(mockEmptyEvent())
    })

    expect(layoutSetState).not.toHaveBeenCalled()
    expect(settingsSetState).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('shows toast for invalid JSON', async () => {
    const { result } = renderHook(() => useBackupRestore())

    await act(async () => {
      await result.current.handleImport(mockFileEvent('not valid json{{{'))
    })

    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('导入失败'), 'error')
    expect(layoutSetState).not.toHaveBeenCalled()
  })

  it('shows toast for JSON that is not an object', async () => {
    const { result } = renderHook(() => useBackupRestore())

    await act(async () => {
      await result.current.handleImport(mockFileEvent('[1, 2, 3]'))
    })

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('文件不是合法 JSON 对象'),
      'error',
    )
  })

  it('shows toast for unsupported version', async () => {
    const { result } = renderHook(() => useBackupRestore())

    await act(async () => {
      await result.current.handleImport(mockFileEvent({ version: 99 }))
    })

    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('不支持的版本号: 99'), 'error')
    expect(layoutSetState).not.toHaveBeenCalled()
  })

  it('shows toast for oversized file', async () => {
    const { result } = renderHook(() => useBackupRestore())

    await act(async () => {
      await result.current.handleImport(mockFileEvent({ version: 4 }, MAX_IMPORT_SIZE + 1))
    })

    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('文件过大'), 'error')
    expect(layoutSetState).not.toHaveBeenCalled()
  })

  it('only updates stores for fields present in the JSON', async () => {
    const payload = {
      version: 4,
      settings: { theme: 'light' },
    }

    const { result } = renderHook(() => useBackupRestore())

    await act(async () => {
      await result.current.handleImport(mockFileEvent(payload))
    })

    expect(settingsSetState).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light' }))
    expect(layoutSetState).not.toHaveBeenCalled()
    expect(shortcutsSetState).not.toHaveBeenCalled()
    expect(todoSetState).not.toHaveBeenCalled()
  })

  it('resets input value after import (even on error)', async () => {
    const event = mockFileEvent('bad json{{{')
    const { result } = renderHook(() => useBackupRestore())

    await act(async () => {
      await result.current.handleImport(event)
    })

    expect(event.target.value).toBe('')
  })

  it('handles import with all supported versions', async () => {
    for (const version of SUPPORTED_VERSIONS) {
      layoutSetState.mockClear()
      settingsSetState.mockClear()
      vi.mocked(showToast).mockClear()

      const payload = { version }
      const { result } = renderHook(() => useBackupRestore())

      await act(async () => {
        await result.current.handleImport(mockFileEvent(payload))
      })

      expect(showToast).not.toHaveBeenCalled()
    }
  })
})
