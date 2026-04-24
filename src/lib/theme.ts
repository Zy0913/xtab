import { useSettingsStore } from '@/store/useSettingsStore'
import { extractWallpaperTint } from '@/lib/wallpaperTint'

export function applyTheme(theme: 'light' | 'dark' | 'system') {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

export function applyGlassMode(mode: 'sequoia' | 'tahoe') {
  document.documentElement.classList.toggle('glass-mode', mode === 'tahoe')
}

export function applyWallpaperTint(tint: string | null) {
  const root = document.documentElement
  if (tint) {
    root.style.setProperty('--wallpaper-tint', tint)
    root.style.setProperty('--accent', tint)
  } else {
    root.style.removeProperty('--wallpaper-tint')
    root.style.removeProperty('--accent')
  }
}

export function applyReduceMotion(reduce: boolean) {
  document.documentElement.classList.toggle('reduce-motion', reduce)
}

export async function refreshWallpaperTint() {
  const wallpaper = useSettingsStore.getState().wallpaper
  if (!wallpaper) {
    useSettingsStore.getState().setWallpaperTint(null)
    applyWallpaperTint(null)
    return
  }

  const tint = await extractWallpaperTint(wallpaper)
  if (tint) {
    useSettingsStore.getState().setWallpaperTint(tint.rgb)
    applyWallpaperTint(tint.rgb)
  }
}

export async function initTheme() {
  const state = useSettingsStore.getState()
  applyTheme(state.theme)
  applyGlassMode(state.glassMode)
  applyReduceMotion(state.reduceMotion)

  // If no tint cached but wallpaper exists, extract on init
  if (!state.wallpaperTint && state.wallpaper) {
    await refreshWallpaperTint()
  } else {
    applyWallpaperTint(state.wallpaperTint)
  }

  useSettingsStore.subscribe((next, prev) => {
    if (next.theme !== prev.theme) applyTheme(next.theme)
    if (next.glassMode !== prev.glassMode) applyGlassMode(next.glassMode)
    if (next.reduceMotion !== prev.reduceMotion) applyReduceMotion(next.reduceMotion)
    if (next.wallpaperTint !== prev.wallpaperTint) applyWallpaperTint(next.wallpaperTint)
    if (next.wallpaper !== prev.wallpaper) {
      // Debounce tint extraction when wallpaper changes
      refreshWallpaperTint().catch(console.debug)
    }
  })

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (useSettingsStore.getState().theme === 'system') applyTheme('system')
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
