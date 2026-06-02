import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration, registerRemoteSync } from './storage'

interface BookmarksUiState {
  expandedIds: string[]
  toggleExpanded: (id: string) => void
}

export const useBookmarksUiStore = create<BookmarksUiState>()(
  persist(
    (set) => ({
      // Default empty array means nothing is expanded by default
      expandedIds: [],
      toggleExpanded: (id) =>
        set((s) => ({
          expandedIds: s.expandedIds.includes(id)
            ? s.expandedIds.filter((i) => i !== id)
            : [...s.expandedIds, id],
        })),
    }),
    {
      name: 'tab:bookmarks-ui',
      storage: createJSONStorage(() => chromeStorage),
      skipHydration: true,
      version: 1,
    },
  ),
)

registerHydration(() => useBookmarksUiStore.persist.rehydrate())
registerRemoteSync('tab:bookmarks-ui', () => useBookmarksUiStore.persist.rehydrate())
