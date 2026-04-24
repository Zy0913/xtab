import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'

interface WallpaperState {
  loadedUrl: string | null
  prevUrl: string | null
  visible: boolean
}

export function useWallpaper() {
  const wallpaper = useSettingsStore((s) => s.wallpaper)
  const [state, setState] = useState<WallpaperState>({
    loadedUrl: null,
    prevUrl: null,
    visible: false,
  })

  useEffect(() => {
    if (!wallpaper) {
      const t = setTimeout(() => {
        setState((prev) => ({
          loadedUrl: null,
          prevUrl: prev.loadedUrl,
          visible: true,
        }))
      }, 0)
      return () => clearTimeout(t)
    }

    if (wallpaper === state.loadedUrl) return

    const t1 = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        prevUrl: prev.loadedUrl,
        visible: false,
      }))
    }, 0)

    const img = new Image()
    img.onload = () => {
      requestAnimationFrame(() => {
        setState((prev) => ({
          loadedUrl: wallpaper,
          prevUrl: prev.prevUrl,
          visible: true,
        }))
      })
    }
    img.onerror = () => {
      requestAnimationFrame(() => {
        setState((prev) => ({
          loadedUrl: wallpaper,
          prevUrl: prev.prevUrl,
          visible: true,
        }))
      })
    }
    img.src = wallpaper

    return () => clearTimeout(t1)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- wallpaper is the only intended trigger
  }, [wallpaper])

  return state
}
