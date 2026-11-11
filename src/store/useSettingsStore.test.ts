import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '@/store/useSettingsStore'
import { DEFAULT_WALLPAPER, OLD_DEFAULT_WALLPAPER } from '@/lib/wallpapers'
import { getDefaultSearchEngine } from '@/lib/region'
import { recentWallpapers } from '@/lib/recentWallpapers'

function resetStore() {
  useSettingsStore.setState({
    theme: 'system',
    glassMode: 'sequoia',
    searchEngine: getDefaultSearchEngine(),
    wallpaper: DEFAULT_WALLPAPER,
    wallpaperTint: null,
    wallpaperLuminance: null,
    wallpaperDimming: 0.15,
    glassTint: 0.5,
    showSeconds: false,
    editMode: false,
    reduceMotion: false,
    onboardingDone: true,
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
    expect(s.wallpaperDimming).toBe(0.15)
    expect(s.glassTint).toBe(0.5)
    expect(s.showSeconds).toBe(false)
    expect(s.editMode).toBe(false)
    expect(s.reduceMotion).toBe(false)
    expect(s.onboardingDone).toBe(true)
  })

  it('completeOnboarding and resetOnboarding toggle flag', () => {
    useSettingsStore.getState().resetOnboarding()
    expect(useSettingsStore.getState().onboardingDone).toBe(false)
    useSettingsStore.getState().completeOnboarding()
    expect(useSettingsStore.getState().onboardingDone).toBe(true)
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

  it('setWallpaper notes the wallpaper so random picks pass over it', () => {
    useSettingsStore.getState().setWallpaper('https://example.com/shown.jpg')
    expect(recentWallpapers().at(-1)).toBe('https://example.com/shown.jpg')
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

  it('setGlassTint clamps values 0-1', () => {
    useSettingsStore.getState().setGlassTint(0.8)
    expect(useSettingsStore.getState().glassTint).toBe(0.8)
    useSettingsStore.getState().setGlassTint(2)
    expect(useSettingsStore.getState().glassTint).toBe(1)
    useSettingsStore.getState().setGlassTint(-1)
    expect(useSettingsStore.getState().glassTint).toBe(0)
  })

  it('setShowSeconds toggles the seconds counter', () => {
    useSettingsStore.getState().setShowSeconds(true)
    expect(useSettingsStore.getState().showSeconds).toBe(true)
    useSettingsStore.getState().setShowSeconds(false)
    expect(useSettingsStore.getState().showSeconds).toBe(false)
  })
})

describe('useSettingsStore migrations', () => {
  const migrate = useSettingsStore.persist.getOptions().migrate!

  it('drops a tint read the old way so it is read again, keeping the rest', async () => {
    const saved = {
      wallpaper: 'https://example.com/forest.jpg',
      wallpaperTint: 'rgb(0, 0, 179)',
      wallpaperLuminance: 0.1,
      glassTint: 0.7,
      showSeconds: true,
      onboardingDone: true,
    }
    expect(await migrate({ ...saved }, 6)).toEqual({ ...saved, wallpaperTint: null })
  })

  it('moves whoever had the old drawing to the photo, its colours read again', async () => {
    const saved = {
      wallpaper: OLD_DEFAULT_WALLPAPER,
      wallpaperTint: 'rgb(42, 76, 86)',
      wallpaperLuminance: 0.06,
      wallpaperDimming: 0.15,
      onboardingDone: true,
    }
    expect(await migrate({ ...saved }, 7)).toEqual({
      ...saved,
      wallpaper: DEFAULT_WALLPAPER,
      wallpaperTint: null,
      wallpaperLuminance: null,
    })
  })

  it('leaves any other wallpaper and its colours as they were', async () => {
    const saved = {
      wallpaper: 'https://example.com/forest.jpg',
      wallpaperTint: 'rgb(0, 0, 179)',
      wallpaperLuminance: 0.1,
    }
    expect(await migrate({ ...saved }, 7)).toEqual(saved)
  })
})
