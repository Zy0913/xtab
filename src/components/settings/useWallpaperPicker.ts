import { useMemo, useRef, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useFavoriteWallpapersStore } from '@/store/useFavoriteWallpapersStore'
import { fetchRandomWallhaven, type WallhavenResult, type WallhavenStrategy } from '@/lib/wallhaven'
import { pickFallbackWallpaper } from '@/lib/wallpapers'
import { warmWallpaperCache } from '@/lib/wallpaperCache'
import { showToast } from '@/lib/toast'
import { warn, error as logError } from '@/lib/logger'

const MAX_FILE_SIZE_MB = 5

const STRATEGY_LABEL: Record<string, string> = {
  '1d': '日榜',
  '3d': '3日榜',
  '1w': '周榜',
  '1M': '月榜',
  '3M': '3月榜',
  '6M': '半年榜',
  '1y': '年榜',
}

function strategyLabel(key: string): string {
  return STRATEGY_LABEL[key] ?? key
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function preloadImage(url: string) {
  try {
    const pre = new Image()
    pre.decoding = 'async'
    pre.src = url
  } catch {
    // ignore
  }
}

export function useWallpaperPicker() {
  const current = useSettingsStore((s) => s.wallpaper)
  const setWallpaper = useSettingsStore((s) => s.setWallpaper)
  const dimming = useSettingsStore((s) => s.wallpaperDimming)
  const setDimming = useSettingsStore((s) => s.setWallpaperDimming)
  const favoriteItems = useFavoriteWallpapersStore((s) => s.items)
  const addFavorite = useFavoriteWallpapersStore((s) => s.add)
  const fileRef = useRef<HTMLInputElement>(null)
  const [randomLoading, setRandomLoading] = useState(false)
  const [strategy, setStrategy] = useState<WallhavenStrategy>('1M')
  // Last successful wallhaven result; used to drive the "favorite current" button
  // because we don't otherwise know if `current` came from wallhaven.
  const [lastResult, setLastResult] = useState<WallhavenResult | null>(null)

  // Monotonic request id — only the latest click may call setWallpaper.
  // Also prevents double-submit from a stale `randomLoading` closure.
  const randomSeqRef = useRef(0)

  const canFavoriteCurrent = lastResult !== null && lastResult.url === current
  const alreadyFavorited = useMemo(
    () => (lastResult ? favoriteItems.some((x) => x.id === lastResult.id) : false),
    [lastResult, favoriteItems],
  )

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast(`图片过大，请选择小于 ${MAX_FILE_SIZE_MB}MB 的文件`, 'error')
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    try {
      const dataUrl = await fileToDataURL(file)
      // Uploads supersede any in-flight random result.
      randomSeqRef.current += 1
      setRandomLoading(false)
      setWallpaper(dataUrl)
    } catch {
      warn('Failed to read file as data URL')
    }
  }

  const handleRandom = async () => {
    const seq = ++randomSeqRef.current
    setRandomLoading(true)
    try {
      const result = await fetchRandomWallhaven(strategy, current)

      // A newer click (or upload) already owns the UI — drop this result.
      if (seq !== randomSeqRef.current) return

      preloadImage(result.url)
      void warmWallpaperCache(result.url)
      setWallpaper(result.url)
      if (result.via === 'bing') {
        setLastResult(null)
        showToast('排行榜暂时连不上，已换一张必应壁纸', 'info')
        return
      }
      setLastResult(result)
      if (result.actualStrategy !== result.requestedStrategy) {
        showToast(
          `${strategyLabel(result.requestedStrategy)}暂无符合条件的壁纸，已切换至${strategyLabel(result.actualStrategy)}`,
          'info',
        )
      }
    } catch (err) {
      if (seq !== randomSeqRef.current) return
      const fallback = pickFallbackWallpaper(current, favoriteItems)
      if (fallback) {
        warn('Random wallpaper unavailable, using fallback:', err)
        preloadImage(fallback)
        void warmWallpaperCache(fallback)
        setWallpaper(fallback)
        setLastResult(null)
        showToast('排行榜暂时连不上，已换一张备用壁纸', 'info')
        return
      }
      logError('Random wallpaper failed:', err)
      const message = err instanceof Error && err.message ? err.message : '获取壁纸失败，请重试'
      showToast(message, 'error')
    } finally {
      // Only the latest request clears the spinner.
      if (seq === randomSeqRef.current) setRandomLoading(false)
    }
  }

  const handleFavorite = () => {
    if (!canFavoriteCurrent || !lastResult) return
    const ok = addFavorite({
      id: lastResult.id,
      url: lastResult.url,
      thumb: lastResult.thumb,
      resolution: lastResult.resolution,
      source: 'wallhaven',
      strategy: lastResult.actualStrategy,
    })
    showToast(ok ? '已加入收藏' : '已经在收藏中了', 'info')
  }

  return {
    current,
    dimming,
    setDimming,
    setWallpaper,
    fileRef,
    randomLoading,
    strategy,
    setStrategy,
    canFavoriteCurrent,
    alreadyFavorited,
    handleUpload,
    handleRandom,
    handleFavorite,
  }
}
