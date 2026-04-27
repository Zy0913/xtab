import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration, registerRemoteSync } from './storage'

export interface FavoriteWallpaper {
  id: string
  url: string
  thumb: string
  addedAt: number
  source: 'wallhaven'
  resolution?: string
  strategy?: string
}

const MAX_FAVORITES = 24

interface FavoritesState {
  items: FavoriteWallpaper[]
  add: (fav: Omit<FavoriteWallpaper, 'addedAt'>) => boolean
  remove: (id: string) => void
  clear: () => void
}

export const useFavoriteWallpapersStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (fav) => {
        if (get().items.some((x) => x.id === fav.id)) return false
        const next = [{ ...fav, addedAt: Date.now() }, ...get().items].slice(0, MAX_FAVORITES)
        set({ items: next })
        return true
      },
      remove: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'tab:favorite-wallpapers',
      storage: createJSONStorage(() => chromeStorage),
      skipHydration: true,
      version: 1,
      migrate: (persisted) => persisted,
    },
  ),
)

registerHydration(() => useFavoriteWallpapersStore.persist.rehydrate())
registerRemoteSync('tab:favorite-wallpapers', () =>
  useFavoriteWallpapersStore.persist.rehydrate(),
)
