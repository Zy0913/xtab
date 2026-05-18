import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration, registerRemoteSync } from './storage'
import { DEFAULT_WALLPAPER } from '@/lib/wallpapers'

export type ThemeMode = 'light' | 'dark' | 'system'
export type GlassMode = 'sequoia' | 'tahoe'
export type SearchEngine = 'google' | 'bing' | 'baidu' | 'duckduckgo'

interface SettingsState {
  theme: ThemeMode
  glassMode: GlassMode
  searchEngine: SearchEngine
  wallpaper: string
  wallpaperTint: string | null
  /** Dominant luminance of the wallpaper (0..1, WCAG relative luminance). Drives adaptive text contrast. */
  wallpaperLuminance: number | null
  /** Manual scrim above the wallpaper (0..0.6) to keep foreground text readable. */
  wallpaperDimming: number
  editMode: boolean
  reduceMotion: boolean
  setTheme: (theme: ThemeMode) => void
  setGlassMode: (mode: GlassMode) => void
  setSearchEngine: (engine: SearchEngine) => void
  setWallpaper: (wallpaper: string) => void
  setWallpaperTint: (tint: string | null) => void
  setWallpaperLuminance: (v: number | null) => void
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
      wallpaperLuminance: null,
      wallpaperDimming: 0.25,
      editMode: false,
      reduceMotion: false,
      setTheme: (theme) => set({ theme }),
      setGlassMode: (glassMode) => set({ glassMode }),
      setSearchEngine: (searchEngine) => set({ searchEngine }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setWallpaperTint: (wallpaperTint) => set({ wallpaperTint }),
      setWallpaperLuminance: (wallpaperLuminance) => set({ wallpaperLuminance }),
      setWallpaperDimming: (v) => set({ wallpaperDimming: clampDimming(v) }),
      toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    {
      name: 'tab:settings',
      storage: createJSONStorage(() => chromeStorage),
      skipHydration: true,
      version: 4,
      migrate: (persisted, fromVersion) => {
        const data = (persisted ?? {}) as Record<string, unknown>
        // v1 → v2: introduce wallpaperDimming with a sensible default.
        if (fromVersion < 2 && data.wallpaperDimming === undefined) {
          data.wallpaperDimming = 0.25
        }
        // v2 → v3: introduce wallpaperIsDark; null means "unknown, re-extract on init".
        if (fromVersion < 3 && data.wallpaperIsDark === undefined) {
          data.wallpaperIsDark = null
        }
        // v3 → v4: replace binary wallpaperIsDark with continuous wallpaperLuminance.
        if (fromVersion < 4) {
          if (data.wallpaperIsDark !== undefined) {
            // Convert: true → 0.3 (dark), false → 0.7 (light), null → null
            data.wallpaperLuminance =
              data.wallpaperIsDark === true ? 0.3 : data.wallpaperIsDark === false ? 0.7 : null
            delete data.wallpaperIsDark
          }
        }
        return data as unknown as SettingsState
      },
    },
  ),
)

registerHydration(() => useSettingsStore.persist.rehydrate())
registerRemoteSync('tab:settings', () => useSettingsStore.persist.rehydrate())
