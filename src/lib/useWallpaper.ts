import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'

export function useWallpaper() {
  const wallpaper = useSettingsStore((s) => s.wallpaper)
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)
  const [, setReady] = useState(false)
  const [visible, setVisible] = useState(false)
  const prevUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!wallpaper) {
      setLoadedUrl(null)
      setReady(true)
      setVisible(true)
      return
    }

    if (wallpaper === loadedUrl) return

    if (loadedUrl) {
      prevUrlRef.current = loadedUrl
    }

    setReady(false)
    setVisible(false)

    const img = new Image()
    img.onload = () => {
      setLoadedUrl(wallpaper)
      setReady(true)
      // Delay setVisible slightly so opacity transition can start from 0
      requestAnimationFrame(() => {
        setVisible(true)
      })
    }
    img.onerror = () => {
      setLoadedUrl(wallpaper)
      setReady(true)
      requestAnimationFrame(() => {
        setVisible(true)
      })
    }
    img.src = wallpaper
  }, [wallpaper]) // eslint-disable-line react-hooks/exhaustive-deps

  return { loadedUrl, prevUrl: prevUrlRef.current, visible }
}