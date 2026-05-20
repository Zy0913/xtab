import { describe, it, expect, beforeEach } from 'vitest'
import { useLayoutStore } from '@/store/useLayoutStore'
import type { WidgetId, WidgetLayout } from '@/types/widget'

const DEFAULT_LAYOUTS: WidgetLayout[] = [
  { i: 'clock', x: 0, y: 0, w: 12, h: 3, minW: 4, minH: 2 },
  { i: 'search', x: 0, y: 3, w: 12, h: 1, minW: 4, minH: 1 },
  { i: 'shortcuts', x: 0, y: 4, w: 12, h: 3, minW: 4, minH: 2 },
  { i: 'weather', x: 0, y: 7, w: 4, h: 4, minW: 3, minH: 3 },
  { i: 'todo', x: 4, y: 7, w: 4, h: 4, minW: 3, minH: 3 },
  { i: 'bookmarks', x: 8, y: 7, w: 4, h: 4, minW: 3, minH: 3 },
]

const DEFAULT_ENABLED: WidgetId[] = ['clock', 'search', 'shortcuts', 'weather', 'todo', 'bookmarks']

beforeEach(() => {
  useLayoutStore.setState({ layouts: DEFAULT_LAYOUTS, enabled: DEFAULT_ENABLED })
})

describe('useLayoutStore', () => {
  it('has correct default layouts', () => {
    const s = useLayoutStore.getState()
    expect(s.layouts).toHaveLength(6)
    expect(s.enabled).toEqual(DEFAULT_ENABLED)
  })

  it('setLayouts replaces layout array', () => {
    const newLayouts: WidgetLayout[] = [DEFAULT_LAYOUTS[0]]
    useLayoutStore.getState().setLayouts(newLayouts)
    expect(useLayoutStore.getState().layouts).toHaveLength(1)
  })

  it('toggleWidget removes enabled widget', () => {
    useLayoutStore.getState().toggleWidget('weather')
    const enabled = useLayoutStore.getState().enabled
    expect(enabled).not.toContain('weather')
    expect(enabled).toHaveLength(5)
  })

  it('toggleWidget adds back disabled widget', () => {
    useLayoutStore.getState().toggleWidget('weather')
    useLayoutStore.getState().toggleWidget('weather')
    const enabled = useLayoutStore.getState().enabled
    expect(enabled).toContain('weather')
    expect(enabled).toHaveLength(6)
  })

  it('reset restores defaults', () => {
    useLayoutStore.getState().setLayouts([])
    useLayoutStore.getState().toggleWidget('weather')
    useLayoutStore.getState().reset()
    const s = useLayoutStore.getState()
    expect(s.layouts).toHaveLength(6)
    expect(s.enabled).toEqual(DEFAULT_ENABLED)
  })
})
