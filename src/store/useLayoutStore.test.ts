import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_ENABLED,
  DEFAULT_LAYOUTS,
  isUntouchedV2Layout,
  migrateLayoutState,
  placeInFreeSpot,
  useLayoutStore,
} from '@/store/useLayoutStore'
import type { WidgetLayout } from '@/types/widget'

/** The v2 defaults as saved, with the lone weather card stretched across the row. */
const V2_SAVED: WidgetLayout[] = [
  { i: 'clock', x: 0, y: 0, w: 12, h: 2, minW: 4, minH: 2 },
  { i: 'search', x: 0, y: 2, w: 12, h: 1, minW: 4, minH: 1 },
  { i: 'shortcuts', x: 0, y: 3, w: 12, h: 2, minW: 4, minH: 2 },
  { i: 'weather', x: 0, y: 5, w: 12, h: 3, minW: 3, minH: 3 },
  { i: 'todo', x: 5, y: 8, w: 4, h: 3, minW: 3, minH: 3 },
  { i: 'bookmarks', x: 9, y: 8, w: 3, h: 3, minW: 3, minH: 3 },
]

beforeEach(() => {
  useLayoutStore.setState({ layouts: DEFAULT_LAYOUTS, enabled: DEFAULT_ENABLED, customized: false })
})

describe('useLayoutStore', () => {
  it('has correct default layouts', () => {
    const s = useLayoutStore.getState()
    expect(s.layouts).toHaveLength(6)
    expect(s.enabled).toEqual(DEFAULT_ENABLED)
    expect(s.enabled).not.toContain('todo')
    expect(s.enabled).not.toContain('bookmarks')
    expect(s.customized).toBe(false)
    expect(s.layouts.find((l) => l.i === 'clock')?.h).toBe(2)
    expect(s.layouts.find((l) => l.i === 'shortcuts')?.h).toBe(2)
  })

  it('cards share the last row in equal thirds', () => {
    const cards = DEFAULT_LAYOUTS.filter((l) => l.y === 5)
    expect(cards.map(({ x, w }) => ({ x, w }))).toEqual([
      { x: 0, w: 4 },
      { x: 4, w: 4 },
      { x: 8, w: 4 },
    ])
  })

  it('setLayouts replaces the layout and marks it customized', () => {
    const newLayouts: WidgetLayout[] = [DEFAULT_LAYOUTS[0]]
    useLayoutStore.getState().setLayouts(newLayouts)
    expect(useLayoutStore.getState().layouts).toHaveLength(1)
    expect(useLayoutStore.getState().customized).toBe(true)
  })

  it('toggleWidget removes enabled widget', () => {
    useLayoutStore.getState().toggleWidget('weather')
    const enabled = useLayoutStore.getState().enabled
    expect(enabled).not.toContain('weather')
    expect(enabled).toHaveLength(3)
  })

  it('toggleWidget adds back disabled widget', () => {
    useLayoutStore.getState().toggleWidget('todo')
    const enabled = useLayoutStore.getState().enabled
    expect(enabled).toContain('todo')
    expect(enabled).toHaveLength(5)
  })

  it('moves a returning widget out of a spot another widget took', () => {
    // Saved after a drag while the lone weather card was centred.
    const arranged = DEFAULT_LAYOUTS.map((l) => (l.i === 'weather' ? { ...l, x: 4 } : l))
    useLayoutStore.setState({ layouts: arranged, customized: true })
    useLayoutStore.getState().toggleWidget('todo')
    useLayoutStore.getState().toggleWidget('bookmarks')
    const at = (id: string) => useLayoutStore.getState().layouts.find((l) => l.i === id)
    expect(at('todo')).toMatchObject({ x: 0, y: 5 })
    expect(at('bookmarks')).toMatchObject({ x: 8, y: 5 })
    expect(at('weather')).toMatchObject({ x: 4, y: 5 })
  })

  it('leaves layouts alone when switching widgets in an untouched layout', () => {
    useLayoutStore.getState().toggleWidget('todo')
    expect(useLayoutStore.getState().layouts).toBe(DEFAULT_LAYOUTS)
  })

  it('reset restores defaults', () => {
    useLayoutStore.getState().setLayouts([])
    useLayoutStore.getState().toggleWidget('weather')
    useLayoutStore.getState().reset()
    const s = useLayoutStore.getState()
    expect(s.layouts).toHaveLength(6)
    expect(s.enabled).toEqual(DEFAULT_ENABLED)
    expect(s.customized).toBe(false)
  })
})

describe('placeInFreeSpot', () => {
  const wide: WidgetLayout[] = [
    { i: 'clock', x: 0, y: 0, w: 12, h: 2 },
    { i: 'weather', x: 0, y: 2, w: 12, h: 3 },
    { i: 'todo', x: 4, y: 2, w: 4, h: 3 },
  ]

  it('keeps a widget whose old spot is still free', () => {
    const free = wide.map((l) => (l.i === 'weather' ? { ...l, w: 4 } : l))
    expect(placeInFreeSpot(free, ['clock', 'weather'], 'todo')).toBe(free)
  })

  it('starts a new row when the last one is full', () => {
    const next = placeInFreeSpot(wide, ['clock', 'weather'], 'todo')
    expect(next.find((l) => l.i === 'todo')).toMatchObject({ x: 0, y: 5, w: 4 })
  })
})

describe('layout migration', () => {
  it('treats a v2 layout with a stretched lone card as untouched', () => {
    expect(isUntouchedV2Layout(V2_SAVED)).toBe(true)
  })

  it('spots a widget the user resized', () => {
    const resized = V2_SAVED.map((l) => (l.i === 'clock' ? { ...l, w: 8 } : l))
    expect(isUntouchedV2Layout(resized)).toBe(false)
  })

  it('spots widgets the user reordered', () => {
    const reordered = V2_SAVED.map((l) =>
      l.i === 'search' ? { ...l, y: 0 } : l.i === 'clock' ? { ...l, y: 1 } : l,
    )
    expect(isUntouchedV2Layout(reordered)).toBe(false)
  })

  it('moves an untouched v2 layout to the v3 defaults', () => {
    const next = migrateLayoutState({ layouts: V2_SAVED, enabled: DEFAULT_ENABLED }, 2)
    expect(next.layouts).toEqual(DEFAULT_LAYOUTS)
    expect(next.customized).toBe(false)
    expect(next.enabled).toEqual(DEFAULT_ENABLED)
  })

  it('keeps a customized v2 layout as it is', () => {
    const custom = V2_SAVED.map((l) => (l.i === 'weather' ? { ...l, w: 6 } : l))
    const next = migrateLayoutState({ layouts: custom, enabled: DEFAULT_ENABLED }, 2)
    expect(next.layouts).toEqual(custom)
    expect(next.customized).toBe(true)
  })
})
