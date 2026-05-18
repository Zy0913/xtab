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

export function applyWallpaperLuminance(lum: number | null) {
  // null means "unknown" — we don't apply any class or variable.
  // Otherwise we set a CSS custom property so styles can react to the exact value.
  const root = document.documentElement
  if (lum === null) {
    root.classList.remove('wallpaper-dark', 'wallpaper-mid', 'wallpaper-light')
    root.style.removeProperty('--wallpaper-luminance')
    return
  }
  // Classify for backward-compatible CSS selectors, but also expose the raw value.
  root.classList.remove('wallpaper-dark', 'wallpaper-mid', 'wallpaper-light')
  if (lum < 0.35) root.classList.add('wallpaper-dark')
  else if (lum < 0.55) root.classList.add('wallpaper-mid')
  else root.classList.add('wallpaper-light')
  root.style.setProperty('--wallpaper-luminance', lum.toFixed(3))
}

export function applyReduceMotion(reduce: boolean) {
  document.documentElement.classList.toggle('reduce-motion', reduce)
}

export async function refreshWallpaperTint() {
  const store = useSettingsStore.getState()
  const wallpaper = store.wallpaper
  if (!wallpaper) {
    store.setWallpaperTint(null)
    store.setWallpaperLuminance(null)
    applyWallpaperTint(null)
    applyWallpaperLuminance(null)
    return
  }

  const tint = await extractWallpaperTint(wallpaper)
  if (tint) {
    const next = useSettingsStore.getState()
    next.setWallpaperTint(tint.rgb)
    next.setWallpaperLuminance(tint.luminance)
    applyWallpaperTint(tint.rgb)
    applyWallpaperLuminance(tint.luminance)
  }
}

export async function initTheme() {
  const state = useSettingsStore.getState()
  applyTheme(state.theme)
  applyGlassMode(state.glassMode)
  applyReduceMotion(state.reduceMotion)

  // Apply cached values immediately (no flash) while we re-extract if needed.
  applyWallpaperTint(state.wallpaperTint)
  applyWallpaperLuminance(state.wallpaperLuminance)

  // Re-extract when we don't have a cached signal yet.
  const needsExtract =
    state.wallpaper && (!state.wallpaperTint || state.wallpaperLuminance === null)
  if (needsExtract) {
    await refreshWallpaperTint()
  }

  useSettingsStore.subscribe((next, prev) => {
    if (next.theme !== prev.theme) applyTheme(next.theme)
    if (next.glassMode !== prev.glassMode) applyGlassMode(next.glassMode)
    if (next.reduceMotion !== prev.reduceMotion) applyReduceMotion(next.reduceMotion)
    if (next.wallpaperTint !== prev.wallpaperTint) applyWallpaperTint(next.wallpaperTint)
    if (next.wallpaperLuminance !== prev.wallpaperLuminance) applyWallpaperLuminance(next.wallpaperLuminance)
    if (next.wallpaper !== prev.wallpaper) {
      // Debounce tint extraction when wallpaper changes
      refreshWallpaperTint().catch((e) => console.warn('Tint extraction failed:', e))
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
