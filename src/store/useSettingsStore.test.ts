import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '@/store/useSettingsStore'
import { DEFAULT_WALLPAPER } from '@/lib/wallpapers'
import { getDefaultSearchEngine } from '@/lib/region'

function resetStore() {
  useSettingsStore.setState({
    theme: 'system',
    glassMode: 'sequoia',
    searchEngine: getDefaultSearchEngine(),
    wallpaper: DEFAULT_WALLPAPER,
    wallpaperTint: null,
    wallpaperLuminance: null,
    wallpaperDimming: 0.25,
    editMode: false,
    reduceMotion: false,
  })
}

beforeEach(resetStore)

describe('useSettingsStore', () => {
  it('has correct default values', () => {
    const s = useSettingsStore.getState()
    expect(s.theme).toBe('system')
    expect(s.glassMode).toBe('sequoia')
    expect(s.searchEngine).toBe(getDefaultSearchEngine())
    expect(s.wallpaper).toBe(DEFAULT_WALLPAPER)
    expect(s.wallpaperTint).toBeNull()
    expect(s.wallpaperLuminance).toBeNull()
    expect(s.wallpaperDimming).toBe(0.25)
    expect(s.editMode).toBe(false)
    expect(s.reduceMotion).toBe(false)
  })

  it('setTheme updates theme', () => {
    useSettingsStore.getState().setTheme('dark')
    expect(useSettingsStore.getState().theme).toBe('dark')
    useSettingsStore.getState().setTheme('light')
    expect(useSettingsStore.getState().theme).toBe('light')
  })

  it('setSearchEngine updates engine', () => {
    useSettingsStore.getState().setSearchEngine('baidu')
    expect(useSettingsStore.getState().searchEngine).toBe('baidu')
  })

  it('setWallpaper updates wallpaper', () => {
    useSettingsStore.getState().setWallpaper('https://example.com/bg.jpg')
    expect(useSettingsStore.getState().wallpaper).toBe('https://example.com/bg.jpg')
  })

  it('setWallpaperTint updates and clears tint', () => {
    useSettingsStore.getState().setWallpaperTint('rgb(100,150,200)')
    expect(useSettingsStore.getState().wallpaperTint).toBe('rgb(100,150,200)')
    useSettingsStore.getState().setWallpaperTint(null)
    expect(useSettingsStore.getState().wallpaperTint).toBeNull()
  })

  it('setWallpaperLuminance updates luminance', () => {
    useSettingsStore.getState().setWallpaperLuminance(0.5)
    expect(useSettingsStore.getState().wallpaperLuminance).toBe(0.5)
  })

  it('toggleEditMode toggles edit mode', () => {
    expect(useSettingsStore.getState().editMode).toBe(false)
    useSettingsStore.getState().toggleEditMode()
    expect(useSettingsStore.getState().editMode).toBe(true)
    useSettingsStore.getState().toggleEditMode()
    expect(useSettingsStore.getState().editMode).toBe(false)
  })

  it('setReduceMotion updates reduceMotion', () => {
    useSettingsStore.getState().setReduceMotion(true)
    expect(useSettingsStore.getState().reduceMotion).toBe(true)
  })

  it('setWallpaperDimming clamps values 0-0.6', () => {
    useSettingsStore.getState().setWallpaperDimming(0)
    expect(useSettingsStore.getState().wallpaperDimming).toBe(0)
    useSettingsStore.getState().setWallpaperDimming(0.6)
    expect(useSettingsStore.getState().wallpaperDimming).toBe(0.6)
    useSettingsStore.getState().setWallpaperDimming(1)
    expect(useSettingsStore.getState().wallpaperDimming).toBe(0.6)
    useSettingsStore.getState().setWallpaperDimming(-0.5)
    expect(useSettingsStore.getState().wallpaperDimming).toBe(0)
    useSettingsStore.getState().setWallpaperDimming(0.35)
    expect(useSettingsStore.getState().wallpaperDimming).toBe(0.35)
  })
})
