import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration, registerRemoteSync } from './storage'
import type { WidgetId, WidgetLayout } from '@/types/widget'

interface LayoutState {
  layouts: WidgetLayout[]
  enabled: WidgetId[]
  setLayouts: (layouts: WidgetLayout[]) => void
  toggleWidget: (id: WidgetId) => void
  reset: () => void
}

// Default canvas: airier vertical rhythm (taller rowHeight in GridLayer).
// Clock/search/shortcuts sit higher; weather alone on the bottom with room.
// Todo / bookmarks remain in layout but off by default.
const DEFAULT_LAYOUTS: WidgetLayout[] = [
  { i: 'clock', x: 0, y: 0, w: 12, h: 2, minW: 4, minH: 2 },
  { i: 'search', x: 0, y: 2, w: 12, h: 1, minW: 4, minH: 1 },
  { i: 'shortcuts', x: 0, y: 3, w: 12, h: 2, minW: 4, minH: 2 },
  { i: 'weather', x: 0, y: 5, w: 5, h: 3, minW: 3, minH: 3 },
  { i: 'todo', x: 5, y: 5, w: 4, h: 3, minW: 3, minH: 3 },
  { i: 'bookmarks', x: 9, y: 5, w: 3, h: 3, minW: 3, minH: 3 },
]

const DEFAULT_ENABLED: WidgetId[] = ['clock', 'search', 'shortcuts', 'weather']

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layouts: DEFAULT_LAYOUTS,
      enabled: DEFAULT_ENABLED,
      setLayouts: (layouts) => set({ layouts }),
      toggleWidget: (id) =>
        set((s) => ({
          enabled: s.enabled.includes(id) ? s.enabled.filter((w) => w !== id) : [...s.enabled, id],
        })),
      reset: () => set({ layouts: DEFAULT_LAYOUTS, enabled: DEFAULT_ENABLED }),
    }),
    {
      name: 'tab:layout',
      storage: createJSONStorage(() => chromeStorage),
      skipHydration: true,
      version: 2,
      migrate: (persisted, fromVersion) => {
        const data = (persisted ?? {}) as Record<string, unknown>
        // v1 → v2: roomier default grid (shorter clock/shortcuts stacks).
        if (fromVersion < 2) {
          data.layouts = DEFAULT_LAYOUTS
        }
        return data as unknown as LayoutState
      },
    },
  ),
)

registerHydration(() => useLayoutStore.persist.rehydrate())
registerRemoteSync('tab:layout', () => useLayoutStore.persist.rehydrate())
