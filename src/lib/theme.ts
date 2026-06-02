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
    const isDark = root.classList.contains('dark')
    if (isDark) {
      root.style.setProperty('--accent-hover', `color-mix(in srgb, ${tint} 85%, white)`)
    } else {
      root.style.setProperty('--accent-hover', `color-mix(in srgb, ${tint} 85%, black)`)
    }
  } else {
    root.style.removeProperty('--wallpaper-tint')
    root.style.removeProperty('--accent')
    root.style.removeProperty('--accent-hover')
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
