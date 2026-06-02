import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTabsPicker } from './useTabsPicker'
import { useOpenTabs, groupTabsByWindow } from './useOpenTabs'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { showToast } from '@/lib/toast'
import type { OpenTab } from './useOpenTabs'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('./useOpenTabs', () => ({
  useOpenTabs: vi.fn(),
  groupTabsByWindow: vi.fn((tabs) => (tabs.length ? [{ windowId: 1, isCurrent: true, tabs }] : [])),
  normalizeUrlKey: vi.fn((url: string) => url.replace(/\/$/, '')),
}))

// The `add` spy must be stable across re-renders within a single test so that
// we can assert on it after handleSubmit.  We create it in the outer scope
// and reset it in beforeEach.
const mockAdd = vi.fn()

vi.mock('@/store/useShortcutsStore', () => ({
  useShortcutsStore: vi.fn((selector) => {
    const state = { items: [] as { url: string }[], add: mockAdd }
    return selector ? selector(state) : state
  }),
}))

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockedUseOpenTabs = vi.mocked(useOpenTabs)
const mockedShowToast = vi.mocked(showToast)
const mockedUseShortcutsStore = vi.mocked(useShortcutsStore)

const mockTabs: OpenTab[] = [
  {
    id: 1,
    windowId: 1,
    title: 'GitHub',
    url: 'https://github.com/',
    favIconUrl: '',
    isCurrentWindow: true,
    isActive: false,
  },
  {
    id: 2,
    windowId: 1,
    title: 'Google',
    url: 'https://google.com/',
    favIconUrl: '',
    isCurrentWindow: true,
    isActive: false,
  },
]

const defaultProps = { active: true, onClose: vi.fn() }

/** Configure the useOpenTabs mock to return the given tabs / error. */
function setTabs(tabs: OpenTab[], error: string | null = null) {
  mockedUseOpenTabs.mockReturnValue({ tabs, error, refresh: vi.fn() })
}

/** Configure the store mock with specific items (stable mockAdd). */
function setStoreItems(items: { url: string }[]) {
  mockedUseShortcutsStore.mockImplementation((selector?: unknown) => {
    const state = { items, add: mockAdd }
    return typeof selector === 'function'
      ? (selector as (s: typeof state) => unknown)(state)
      : state
  })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  setTabs(mockTabs)
  setStoreItems([])
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTabsPicker', () => {
  // 1. Initial state ----------------------------------------------------------
  it('has correct initial state with empty tabs', () => {
    setTabs([])
    const { result } = renderHook(() => useTabsPicker(defaultProps))

    expect(result.current.query).toBe('')
    expect(result.current.selected.size).toBe(0)
    expect(result.current.groups).toEqual([])
    expect(result.current.selectableKeys).toEqual([])
    expect(result.current.allSelected).toBe(false)
    expect(result.current.totalSelected).toBe(0)
  })

  // 2. Search filtering ------------------------------------------------------
  it('filters groups by search query matching title or url', () => {
    const { result } = renderHook(() => useTabsPicker(defaultProps))

    act(() => {
      result.current.setQuery('github')
    })

    // groupTabsByWindow was called with only the GitHub tab
    expect(groupTabsByWindow).toHaveBeenLastCalledWith([mockTabs[0]])
    expect(result.current.groups[0].tabs).toHaveLength(1)
    expect(result.current.groups[0].tabs[0].title).toBe('GitHub')

    // selectableKeys should also reflect only the filtered tab
    expect(result.current.selectableKeys).toEqual(['https://github.com'])
  })

  // 3. Toggle selection ------------------------------------------------------
  it('toggles a key in and out of the selected set', () => {
    const { result } = renderHook(() => useTabsPicker(defaultProps))
    const key = 'https://github.com' // normalizeUrlKey strips trailing /

    // Toggle in
    act(() => {
      result.current.toggle(key)
    })
    expect(result.current.selected.has(key)).toBe(true)
    expect(result.current.totalSelected).toBe(1)

    // Toggle out
    act(() => {
      result.current.toggle(key)
    })
    expect(result.current.selected.has(key)).toBe(false)
    expect(result.current.totalSelected).toBe(0)
  })

  // 4. toggleAll -------------------------------------------------------------
  it('selects all selectable keys, then deselects on second call', () => {
    const { result } = renderHook(() => useTabsPicker(defaultProps))

    // First toggleAll — select everything
    act(() => {
      result.current.toggleAll()
    })
    expect(result.current.selected.has('https://github.com')).toBe(true)
    expect(result.current.selected.has('https://google.com')).toBe(true)
    expect(result.current.allSelected).toBe(true)
    expect(result.current.totalSelected).toBe(2)

    // Second toggleAll — deselect everything
    act(() => {
      result.current.toggleAll()
    })
    expect(result.current.selected.has('https://github.com')).toBe(false)
    expect(result.current.selected.has('https://google.com')).toBe(false)
    expect(result.current.allSelected).toBe(false)
    expect(result.current.totalSelected).toBe(0)
  })

  // 5. existingKeys — already-shortcut tabs are excluded ---------------------
  it('excludes tabs that match existing store items from selectableKeys', () => {
    // GitHub URL in the store normalizes to 'https://github.com'
    setStoreItems([{ url: 'https://github.com/' }])

    const { result } = renderHook(() => useTabsPicker(defaultProps))

    // existingKeys should contain the normalized key for the GitHub URL
    expect(result.current.existingKeys.has('https://github.com')).toBe(true)

    // selectableKeys should only contain Google (GitHub is already a shortcut)
    expect(result.current.selectableKeys).toEqual(['https://google.com'])

    // allSelected reflects only the non-existing key
    expect(result.current.allSelected).toBe(false)
    act(() => {
      result.current.toggle('https://google.com')
    })
    expect(result.current.allSelected).toBe(true)
  })

  // 6. handleSubmit — adds selected tabs and resets --------------------------
  it('calls add for each selected tab, shows toast, resets, and calls onClose', () => {
    const mockOnClose = vi.fn()
    const { result } = renderHook(() => useTabsPicker({ active: true, onClose: mockOnClose }))

    // Select both tabs
    act(() => {
      result.current.toggle('https://github.com')
      result.current.toggle('https://google.com')
    })

    // Submit
    act(() => {
      result.current.handleSubmit()
    })

    // add was called for each selected tab with title + url
    expect(mockAdd).toHaveBeenCalledTimes(2)
    expect(mockAdd).toHaveBeenCalledWith({
      title: 'GitHub',
      url: 'https://github.com/',
    })
    expect(mockAdd).toHaveBeenCalledWith({
      title: 'Google',
      url: 'https://google.com/',
    })

    // Success toast
    expect(mockedShowToast).toHaveBeenCalledWith('已添加 2 个快捷方式')

    // Selection was reset
    expect(result.current.selected.size).toBe(0)

    // onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  // 7. handleSubmit with no selection ----------------------------------------
  it('shows info toast when submitting with no selection', () => {
    const mockOnClose = vi.fn()
    const { result } = renderHook(() => useTabsPicker({ active: true, onClose: mockOnClose }))

    act(() => {
      result.current.handleSubmit()
    })

    expect(mockedShowToast).toHaveBeenCalledWith('未选择任何新标签页', 'info')
    expect(mockAdd).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  // 8. Error state pass-through ----------------------------------------------
  it('passes through error and refresh from useOpenTabs', () => {
    const mockRefresh = vi.fn()
    mockedUseOpenTabs.mockReturnValue({
      tabs: [],
      error: '读取标签页失败',
      refresh: mockRefresh,
    })

    const { result } = renderHook(() => useTabsPicker(defaultProps))

    expect(result.current.error).toBe('读取标签页失败')
    expect(result.current.tabs).toEqual([])

    // Calling refresh should delegate to the useOpenTabs refresh
    act(() => {
      result.current.refresh()
    })
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })
})
