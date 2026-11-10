import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration, registerRemoteSync } from './storage'
import type { WidgetId, WidgetLayout } from '@/types/widget'

interface LayoutState {
  layouts: WidgetLayout[]
  enabled: WidgetId[]
  /**
   * True once the user has moved or resized a widget. Until then the grid
   * re-centres the last row as widgets are switched on and off.
   */
  customized: boolean
  /** Save a layout the user arranged (drag / resize). */
  setLayouts: (layouts: WidgetLayout[]) => void
  toggleWidget: (id: WidgetId) => void
  reset: () => void
}

// Wallpaper widgets stack in the middle of the page; cards share the last
// row in equal thirds. The grid centres whichever cards are switched on.
// Todo / bookmarks stay in the layout but are off by default.
export const DEFAULT_LAYOUTS: WidgetLayout[] = [
  { i: 'clock', x: 0, y: 0, w: 12, h: 2, minW: 4, minH: 2 },
  { i: 'search', x: 0, y: 2, w: 12, h: 1, minW: 4, minH: 1 },
  { i: 'shortcuts', x: 0, y: 3, w: 12, h: 2, minW: 4, minH: 2 },
  { i: 'weather', x: 0, y: 5, w: 4, h: 3, minW: 3, minH: 3 },
  { i: 'todo', x: 4, y: 5, w: 4, h: 3, minW: 3, minH: 3 },
  { i: 'bookmarks', x: 8, y: 5, w: 4, h: 3, minW: 3, minH: 3 },
]

export const DEFAULT_ENABLED: WidgetId[] = ['clock', 'search', 'shortcuts', 'weather']

const READING_ORDER: WidgetId[] = ['clock', 'search', 'shortcuts', 'weather', 'todo', 'bookmarks']
const CARD_WIDGETS = new Set<WidgetId>(['weather', 'todo', 'bookmarks'])

/** Column and size of every widget in the v2 default layout. */
const V2_DEFAULTS: Record<WidgetId, { x: number; w: number; h: number }> = {
  clock: { x: 0, w: 12, h: 2 },
  search: { x: 0, w: 12, h: 1 },
  shortcuts: { x: 0, w: 12, h: 2 },
  weather: { x: 0, w: 5, h: 3 },
  todo: { x: 5, w: 4, h: 3 },
  bookmarks: { x: 9, w: 3, h: 3 },
}

/**
 * v2 saved every layout change, including vertical compaction and the
 * full-width stretch it applied to a lone card, so saved rows are noisy.
 * A layout still counts as untouched when every widget keeps its v2 column,
 * size and order; a card stretched across the whole row also counts.
 */
export function isUntouchedV2Layout(layouts: WidgetLayout[]): boolean {
  const known = layouts.filter((l) => l.i in V2_DEFAULTS)
  const sameShape = known.every((l) => {
    const d = V2_DEFAULTS[l.i]
    if (l.h !== d.h) return false
    if (l.x === d.x && l.w === d.w) return true
    return CARD_WIDGETS.has(l.i) && l.x === 0 && l.w === 12
  })
  if (!sameShape) return false
  const rank = (id: WidgetId) => READING_ORDER.indexOf(id)
  const order = [...known].sort((a, b) => a.y - b.y || rank(a.i) - rank(b.i))
  return order.every((l, idx) => idx === 0 || rank(order[idx - 1].i) < rank(l.i))
}

/**
 * A switched-off widget keeps its old spot in the layout, and the user may
 * have moved another widget there since. Rather than let the grid push one
 * of them down a row, move the returning widget to the first free spot in
 * reading order, the way macOS places a widget added to the desktop.
 */
export function placeInFreeSpot(
  layouts: WidgetLayout[],
  occupied: WidgetId[],
  id: WidgetId,
  cols = 12,
): WidgetLayout[] {
  const item = layouts.find((l) => l.i === id)
  if (!item) return layouts
  const others = layouts.filter((l) => l.i !== id && occupied.includes(l.i))
  const w = Math.min(item.w, cols)
  const fits = (x: number, y: number) =>
    others.every((o) => x + w <= o.x || o.x + o.w <= x || y + item.h <= o.y || o.y + o.h <= y)
  if (item.x + w <= cols && fits(item.x, item.y)) return layouts

  const bottom = Math.max(0, ...others.map((o) => o.y + o.h))
  for (let y = 0; y <= bottom; y++) {
    for (let x = 0; x + w <= cols; x++) {
      if (fits(x, y)) return layouts.map((l) => (l.i === id ? { ...l, x, y, w } : l))
    }
  }
  return layouts
}

export function migrateLayoutState(persisted: unknown, fromVersion: number): LayoutState {
  const data = (persisted ?? {}) as Record<string, unknown>
  if (fromVersion < 3) {
    const saved = Array.isArray(data.layouts) ? (data.layouts as WidgetLayout[]) : []
    // v3: cards in equal thirds, centred while the layout is untouched.
    if (fromVersion < 2 || isUntouchedV2Layout(saved)) {
      data.layouts = DEFAULT_LAYOUTS
      data.customized = false
    } else {
      data.customized = true
    }
  }
  return data as unknown as LayoutState
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layouts: DEFAULT_LAYOUTS,
      enabled: DEFAULT_ENABLED,
      customized: false,
      setLayouts: (layouts) => set({ layouts, customized: true }),
      toggleWidget: (id) =>
        set((s) => {
          if (s.enabled.includes(id)) return { enabled: s.enabled.filter((w) => w !== id) }
          const enabled = [...s.enabled, id]
          // Untouched layouts are packed and centred by the grid instead.
          if (!s.customized) return { enabled }
          return { enabled, layouts: placeInFreeSpot(s.layouts, s.enabled, id) }
        }),
      reset: () => set({ layouts: DEFAULT_LAYOUTS, enabled: DEFAULT_ENABLED, customized: false }),
    }),
    {
      name: 'tab:layout',
      storage: createJSONStorage(() => chromeStorage),
      skipHydration: true,
      version: 3,
      migrate: migrateLayoutState,
    },
  ),
)

registerHydration(() => useLayoutStore.persist.rehydrate())
registerRemoteSync('tab:layout', () => useLayoutStore.persist.rehydrate())
