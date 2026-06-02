import { useSettingsStore } from '@/store/useSettingsStore'
import { extractWallpaperTint } from '@/lib/wallpaperTint'
import { warn } from '@/lib/logger'
import {
  applyThemeAndTint,
  applyGlassMode,
  applyReduceMotion,
  applyWallpaperTint,
  applyWallpaperLuminance,
} from '@/lib/theme'

/**
 * Extract the dominant colour from a wallpaper and report back via callback.
 * Pure orchestration — reads no store state; writes nothing.
 */
export async function refreshWallpaperTint(
  wallpaper: string | null,
  onResult: (tint: { rgb: string; luminance: number } | null) => void,
) {
  if (!wallpaper) {
    onResult(null)
    return
  }
  const tint = await extractWallpaperTint(wallpaper)
  onResult(tint)
}

/**
 * Bootstrap theme side-effects: apply initial values, subscribe to store
 * changes, and listen for system preference updates.
 *
 * Called once from `main.tsx` after stores are hydrated.
 */
export async function initTheme() {
  const state = useSettingsStore.getState()
  // Apply theme + cached tint atomically so the very first paint already
  // shows a fully consistent colour state (no class-only frame).
  applyThemeAndTint(state.theme, state.wallpaperTint)
  applyGlassMode(state.glassMode)
  applyReduceMotion(state.reduceMotion)
  applyWallpaperLuminance(state.wallpaperLuminance)

  // Re-extract when we don't have a cached signal yet.
  const needsExtract =
    state.wallpaper && (!state.wallpaperTint || state.wallpaperLuminance === null)
  if (needsExtract) {
    await refreshWallpaperTint(state.wallpaper, (tint) => {
      if (tint) {
        useSettingsStore.getState().setWallpaperTint(tint.rgb)
        useSettingsStore.getState().setWallpaperLuminance(tint.luminance)
        applyWallpaperTint(tint.rgb)
        applyWallpaperLuminance(tint.luminance)
      } else {
        useSettingsStore.getState().setWallpaperTint(null)
        useSettingsStore.getState().setWallpaperLuminance(null)
        applyWallpaperTint(null)
        applyWallpaperLuminance(null)
      }
    })
  }

  // Debounce tint extraction so rapid wallpaper swaps (e.g., clicking through
  // presets) don't fire a burst of canvas decodes.
  const TINT_DEBOUNCE_MS = 150
  let tintTimer: ReturnType<typeof setTimeout> | null = null
  const scheduleTint = () => {
    if (tintTimer) clearTimeout(tintTimer)
    tintTimer = setTimeout(() => {
      tintTimer = null
      const wallpaper = useSettingsStore.getState().wallpaper
      refreshWallpaperTint(wallpaper, (tint) => {
        if (tint) {
          useSettingsStore.getState().setWallpaperTint(tint.rgb)
          useSettingsStore.getState().setWallpaperLuminance(tint.luminance)
          applyWallpaperTint(tint.rgb)
          applyWallpaperLuminance(tint.luminance)
        }
      }).catch((e) => warn('Tint extraction failed:', e))
    }, TINT_DEBOUNCE_MS)
  }

  useSettingsStore.subscribe((next, prev) => {
    if (next.theme !== prev.theme) {
      // Atomic batch: dark class + tint vars updated in a single JS task so
      // the browser never paints an intermediate frame where the class has
      // flipped but `--accent-hover` still reflects the previous theme.
      applyThemeAndTint(next.theme, next.wallpaperTint)
    } else if (next.wallpaperTint !== prev.wallpaperTint) {
      applyWallpaperTint(next.wallpaperTint)
    }
    if (next.glassMode !== prev.glassMode) applyGlassMode(next.glassMode)
    if (next.reduceMotion !== prev.reduceMotion) applyReduceMotion(next.reduceMotion)
    if (next.wallpaperLuminance !== prev.wallpaperLuminance)
      applyWallpaperLuminance(next.wallpaperLuminance)
    if (next.wallpaper !== prev.wallpaper) {
      scheduleTint()
    }
  })

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    const { theme, wallpaperTint } = useSettingsStore.getState()
    if (theme === 'system') {
      // Same atomic batch for OS-level theme flips so we never expose the
      // momentary mismatch between class and tint-derived hover colour.
      applyThemeAndTint('system', wallpaperTint)
    }
  })

  // Respect system prefers-reduced-motion
  const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionMq.addEventListener('change', (e) => {
    const store = useSettingsStore.getState()
    // Only auto-apply if user hasn't explicitly toggled the setting
    if (store.reduceMotion !== e.matches) {
      store.setReduceMotion(e.matches)
    }
  })
}
