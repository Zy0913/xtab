import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration, registerRemoteSync } from './storage'

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
  /** Manual scrim above the wallpaper (0..0.6) to keep foreground text readable. */
  wallpaperDimming: number
  editMode: boolean
  reduceMotion: boolean
  setTheme: (theme: ThemeMode) => void
  setGlassMode: (mode: GlassMode) => void
  setSearchEngine: (engine: SearchEngine) => void
  setWallpaper: (wallpaper: string) => void
  setWallpaperTint: (tint: string | null) => void
  setWallpaperDimming: (v: number) => void
  toggleEditMode: () => void
  setReduceMotion: (v: boolean) => void
}

const clampDimming = (v: number) => Math.max(0, Math.min(0.6, v))

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      glassMode: 'sequoia',
      searchEngine: 'google',
      wallpaper: DEFAULT_WALLPAPER,
      wallpaperTint: null,
      wallpaperDimming: 0.25,
      editMode: false,
      reduceMotion: false,
      setTheme: (theme) => set({ theme }),
      setGlassMode: (glassMode) => set({ glassMode }),
      setSearchEngine: (searchEngine) => set({ searchEngine }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setWallpaperTint: (wallpaperTint) => set({ wallpaperTint }),
      setWallpaperDimming: (v) => set({ wallpaperDimming: clampDimming(v) }),
      toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    {
      name: 'tab:settings',
      storage: createJSONStorage(() => chromeStorage),
      skipHydration: true,
      version: 2,
      migrate: (persisted, fromVersion) => {
        const data = (persisted ?? {}) as Partial<SettingsState>
        // v1 → v2: introduce wallpaperDimming with a sensible default.
        if (fromVersion < 2 && data.wallpaperDimming === undefined) {
          return { ...data, wallpaperDimming: 0.25 } as SettingsState
        }
        return data as SettingsState
      },
    },
  ),
)

registerHydration(() => useSettingsStore.persist.rehydrate())
registerRemoteSync('tab:settings', () => useSettingsStore.persist.rehydrate())
