import { describe, it, expect, beforeEach } from 'vitest'
import { applyWallpaperLuminance } from './theme'

describe('applyWallpaperLuminance', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('wallpaper-dark', 'wallpaper-mid', 'wallpaper-light')
    document.documentElement.style.removeProperty('--wallpaper-luminance')
  })

  it('classifies low luminance as dark', () => {
    applyWallpaperLuminance(0.2)
    expect(document.documentElement.classList.contains('wallpaper-dark')).toBe(true)
  })

  it('classifies mid luminance as mid', () => {
    applyWallpaperLuminance(0.4)
    expect(document.documentElement.classList.contains('wallpaper-mid')).toBe(true)
  })

  it('classifies high luminance as light', () => {
    applyWallpaperLuminance(0.6)
    expect(document.documentElement.classList.contains('wallpaper-light')).toBe(true)
  })

  it('removes all classes when luminance is null', () => {
    applyWallpaperLuminance(0.2)
    applyWallpaperLuminance(null)
    expect(document.documentElement.classList.contains('wallpaper-dark')).toBe(false)
    expect(document.documentElement.classList.contains('wallpaper-mid')).toBe(false)
    expect(document.documentElement.classList.contains('wallpaper-light')).toBe(false)
  })

  it('sets the CSS variable', () => {
    applyWallpaperLuminance(0.456)
    expect(document.documentElement.style.getPropertyValue('--wallpaper-luminance')).toBe('0.456')
  })

  it('removes CSS variable when luminance is null', () => {
    applyWallpaperLuminance(0.3)
    applyWallpaperLuminance(null)
    expect(document.documentElement.style.getPropertyValue('--wallpaper-luminance')).toBe('')
  })
})
