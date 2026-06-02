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

const DEFAULT_LAYOUTS: WidgetLayout[] = [
  { i: 'clock', x: 0, y: 0, w: 12, h: 3, minW: 4, minH: 2 },
  { i: 'search', x: 0, y: 3, w: 12, h: 1, minW: 4, minH: 1 },
  { i: 'shortcuts', x: 0, y: 4, w: 12, h: 3, minW: 4, minH: 2 },
  { i: 'weather', x: 0, y: 7, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'todo', x: 4, y: 7, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'bookmarks', x: 8, y: 7, w: 4, h: 3, minW: 3, minH: 2 },
]

const DEFAULT_ENABLED: WidgetId[] = ['clock', 'search', 'shortcuts', 'weather', 'todo', 'bookmarks']

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
      version: 1,
    },
  ),
)

registerHydration(() => useLayoutStore.persist.rehydrate())
registerRemoteSync('tab:layout', () => useLayoutStore.persist.rehydrate())
