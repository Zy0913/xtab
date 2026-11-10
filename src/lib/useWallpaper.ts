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
  // Ignore decode completions that no longer match the store (stale races).
  const expectedUrlRef = useRef<string | null>(null)

  useEffect(() => {
    expectedUrlRef.current = wallpaper

    if (!wallpaper) {
      setState((prev) => {
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
    let revealed = false
    const expected = wallpaper

    // Keep showing the current wallpaper until the next one is fully decoded.
    ;(async () => {
      const { objectUrl } = await resolveWallpaper(expected)
      if (cancelled || expectedUrlRef.current !== expected) {
        if (objectUrl.startsWith('blob:') && !ownedObjectUrls.current.has(objectUrl)) {
          URL.revokeObjectURL(objectUrl)
        }
        return
      }
      if (objectUrl.startsWith('blob:')) ownedObjectUrls.current.add(objectUrl)

      const img = new Image()
      if ('decoding' in img) {
        try {
          ;(img as HTMLImageElement).decoding = 'async'
        } catch {
          // ignore
        }
      }

      const reveal = () => {
        // Guard: cancel, already revealed (onload + complete), or store moved on.
        if (cancelled || revealed) return
        if (expectedUrlRef.current !== expected) return
        revealed = true

        setState((prev) => {
          if (prev.prevUrl && ownedObjectUrls.current.has(prev.prevUrl)) {
            URL.revokeObjectURL(prev.prevUrl)
            ownedObjectUrls.current.delete(prev.prevUrl)
          }
          const sameAsCurrent = prev.loadedUrl === objectUrl
          return {
            loadedUrl: objectUrl,
            prevUrl: sameAsCurrent ? prev.prevUrl : prev.loadedUrl,
            visible: sameAsCurrent,
          }
        })

        requestAnimationFrame(() => {
          if (cancelled || expectedUrlRef.current !== expected) return
          setState((prev) => (prev.loadedUrl === objectUrl ? { ...prev, visible: true } : prev))
        })
      }

      const onError = () => {
        if (cancelled || revealed) return
        if (expectedUrlRef.current !== expected) return
        revealed = true
        if (objectUrl.startsWith('blob:')) {
          URL.revokeObjectURL(objectUrl)
          ownedObjectUrls.current.delete(objectUrl)
        }
        setState((prev) => ({
          ...prev,
          visible: true,
        }))
      }

      img.onload = reveal
      img.onerror = onError
      img.src = objectUrl
      if (img.complete && img.naturalWidth > 0) {
        reveal()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [wallpaper])

  // Evict other cached blobs after the active wallpaper settles (idle).
  useEffect(() => {
    if (!wallpaper) return
    const settled = wallpaper
    const t = window.setTimeout(() => {
      // Only evict if this URL is still the expected one (no newer swap).
      if (expectedUrlRef.current === settled) {
        void evictOthers(settled)
      }
    }, 2_000)
    return () => window.clearTimeout(t)
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
