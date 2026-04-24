import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { evictOthers, resolveWallpaper } from './wallpaperCache'

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
  // Track object URLs we created so we can revoke them and avoid memory leaks.
  const ownedObjectUrls = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!wallpaper) {
      setState((prev) => {
        // The outgoing prev layer is about to be replaced — revoke if owned.
        if (prev.prevUrl && ownedObjectUrls.current.has(prev.prevUrl)) {
          URL.revokeObjectURL(prev.prevUrl)
          ownedObjectUrls.current.delete(prev.prevUrl)
        }
        return {
          loadedUrl: null,
          prevUrl: prev.loadedUrl,
          visible: true,
        }
      })
      return
    }

    let cancelled = false

    // Start the cross-fade: keep current url1 as prev, hide top.
    // Any URL that was previously prev (url0) leaves the DOM now — revoke it.
    setState((prev) => {
      if (prev.prevUrl && ownedObjectUrls.current.has(prev.prevUrl)) {
        URL.revokeObjectURL(prev.prevUrl)
        ownedObjectUrls.current.delete(prev.prevUrl)
      }
      return {
        ...prev,
        prevUrl: prev.loadedUrl,
        visible: false,
      }
    })

    ;(async () => {
      const { objectUrl } = await resolveWallpaper(wallpaper)
      if (cancelled) {
        if (objectUrl.startsWith('blob:')) URL.revokeObjectURL(objectUrl)
        return
      }
      if (objectUrl.startsWith('blob:')) ownedObjectUrls.current.add(objectUrl)

      const img = new Image()
      const commit = () => {
        if (cancelled) return
        requestAnimationFrame(() => {
          setState((prev) => ({
            loadedUrl: objectUrl,
            prevUrl: prev.prevUrl,
            visible: true,
          }))
        })
      }
      img.onload = commit
      img.onerror = commit
      img.src = objectUrl
    })()

    // Keep only the active wallpaper in IndexedDB.
    void evictOthers(wallpaper)

    return () => {
      cancelled = true
    }
  }, [wallpaper])

  useEffect(() => {
    const owned = ownedObjectUrls.current
    return () => {
      for (const u of owned) URL.revokeObjectURL(u)
      owned.clear()
    }
  }, [])

  return state
}
