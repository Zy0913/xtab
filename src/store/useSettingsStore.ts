import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration } from './storage'

export type ThemeMode = 'light' | 'dark' | 'system'
export type GlassMode = 'sequoia' | 'tahoe'
export type SearchEngine = 'google' | 'bing' | 'baidu' | 'duckduckgo'

const DEFAULT_WALLPAPER =
  'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2560&q=80'

interface SettingsState {
  theme: ThemeMode
  glassMode: GlassMode
  searchEngine: SearchEngine
  wallpaper: string
  wallpaperTint: string | null
  editMode: boolean
  reduceMotion: boolean
  setTheme: (theme: ThemeMode) => void
  setGlassMode: (mode: GlassMode) => void
  setSearchEngine: (engine: SearchEngine) => void
  setWallpaper: (wallpaper: string) => void
  setWallpaperTint: (tint: string | null) => void
  toggleEditMode: () => void
  setReduceMotion: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      glassMode: 'sequoia',
      searchEngine: 'google',
      wallpaper: DEFAULT_WALLPAPER,
      wallpaperTint: null,
      editMode: false,
      reduceMotion: false,
      setTheme: (theme) => set({ theme }),
      setGlassMode: (glassMode) => set({ glassMode }),
      setSearchEngine: (searchEngine) => set({ searchEngine }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setWallpaperTint: (wallpaperTint) => set({ wallpaperTint }),
      toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    {
      name: 'tab:settings',
      storage: createJSONStorage(() => chromeStorage),
      skipHydration: true,
    },
  ),
)

registerHydration(() => useSettingsStore.persist.rehydrate())
