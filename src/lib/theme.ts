type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Resolve the effective dark state from a theme mode without touching the DOM.
 * Used by `applyThemeAndTint` to pre-compute tint variants before flipping
 * the `.dark` class so the cascade settles in a single paint.
 */
export function resolveIsDark(theme: ThemeMode): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', resolveIsDark(theme))
}

export function applyGlassMode(mode: 'sequoia' | 'tahoe') {
  document.documentElement.classList.toggle('glass-mode', mode === 'tahoe')
}

/**
 * Write tint-derived CSS custom properties.
 *
 * Pass `isDark` explicitly when called as part of a theme transition so the
 * `--accent-hover` mix is computed against the *new* dark state rather than
 * the class currently on `<html>`. When omitted we fall back to the live
 * class state for steady-state updates (e.g. wallpaper-only changes).
 */
export function applyWallpaperTint(tint: string | null, isDark?: boolean) {
  const root = document.documentElement
  if (tint) {
    const dark = isDark ?? root.classList.contains('dark')
    root.style.setProperty('--wallpaper-tint', tint)
    root.style.setProperty('--accent', tint)
    root.style.setProperty(
      '--accent-hover',
      dark ? `color-mix(in srgb, ${tint} 85%, white)` : `color-mix(in srgb, ${tint} 85%, black)`,
    )
  } else {
    root.style.removeProperty('--wallpaper-tint')
    root.style.removeProperty('--accent')
    root.style.removeProperty('--accent-hover')
  }
}

/**
 * Atomically apply a theme + wallpaper tint in one synchronous pass.
 *
 * The order matters for flicker-free transitions:
 *   1. Resolve the target dark state up-front.
 *   2. Write tint inline custom properties using that resolved state — these
 *      override any class-derived defaults regardless of the current class.
 *   3. Toggle the `.dark` class.
 *
 * Because all three steps run in a single JS task, the browser only renders
 * the final, fully-consistent state — no intermediate frame where the class
 * has flipped but `--accent` / `--accent-hover` still reflect the old theme.
 */
export function applyThemeAndTint(theme: ThemeMode, tint: string | null) {
  const root = document.documentElement
  const isDark = resolveIsDark(theme)
  applyWallpaperTint(tint, isDark)
  root.classList.toggle('dark', isDark)
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
