import { useMemo, useRef, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useFavoriteWallpapersStore } from '@/store/useFavoriteWallpapersStore'
import { fetchRandomWallhaven, type WallhavenResult, type WallhavenStrategy } from '@/lib/wallhaven'
import { pickFallbackWallpaper } from '@/lib/wallpapers'
import { warmWallpaperCache } from '@/lib/wallpaperCache'
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
  prepareWallpaper,
  saveLocalWallpaper,
  UnreadableImageError,
} from '@/lib/localWallpaper'
import { showToast } from '@/lib/toast'
import { warn, error as logError } from '@/lib/logger'

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
  const storeWallpaper = useSettingsStore((s) => s.setWallpaper)
  const dimming = useSettingsStore((s) => s.wallpaperDimming)
  const setDimming = useSettingsStore((s) => s.setWallpaperDimming)
  const favoriteItems = useFavoriteWallpapersStore((s) => s.items)
  const addFavorite = useFavoriteWallpapersStore((s) => s.add)
  const fileRef = useRef<HTMLInputElement>(null)
  const [randomLoading, setRandomLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [strategy, setStrategy] = useState<WallhavenStrategy>('1M')
  // Last successful wallhaven result; used to drive the "favorite current" button
  // because we don't otherwise know if `current` came from wallhaven.
  const [lastResult, setLastResult] = useState<WallhavenResult | null>(null)

  // Monotonic request id — only the latest choice (a random pick, an upload
  // or a preset) may call setWallpaper. Also prevents double-submit from a
  // stale `randomLoading` closure.
  const requestSeqRef = useRef(0)

  /** Picks a wallpaper outright, dropping any random pick or upload under way. */
  const setWallpaper = (url: string) => {
    requestSeqRef.current += 1
    setRandomLoading(false)
    setUploading(false)
    storeWallpaper(url)
  }

  const canFavoriteCurrent = lastResult !== null && lastResult.url === current
  const alreadyFavorited = useMemo(
    () => (lastResult ? favoriteItems.some((x) => x.id === lastResult.id) : false),
    [lastResult, favoriteItems],
  )

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    // Cleared so that picking the same file again still counts as a change.
    input.value = ''
    if (!file) return

    if (file.size > MAX_UPLOAD_BYTES) {
      showToast(`图片过大，请选择不超过 ${MAX_UPLOAD_MB}MB 的文件`, 'error')
      return
    }

    // Uploads supersede any in-flight random result, and a later choice
    // supersedes the upload.
    const seq = ++requestSeqRef.current
    setRandomLoading(false)
    setUploading(true)
    try {
      const { blob, resizedTo } = await prepareWallpaper(file)
      const key = await saveLocalWallpaper(blob)
      if (seq !== requestSeqRef.current) return
      storeWallpaper(key)
      if (resizedTo) {
        showToast(`图片超过 8K，已缩小到 ${resizedTo.width}×${resizedTo.height}`, 'info')
      }
    } catch (err) {
      if (seq !== requestSeqRef.current) return
      if (err instanceof UnreadableImageError) {
        showToast('无法读取这张图片，换成 JPG、PNG 或 WebP 试试', 'error')
      } else {
        logError('Wallpaper upload failed:', err)
        showToast('图片没能保存，请重试', 'error')
      }
    } finally {
      if (seq === requestSeqRef.current) setUploading(false)
    }
  }

  const handleRandom = async () => {
    const seq = ++requestSeqRef.current
    setRandomLoading(true)
    setUploading(false)
    try {
      const result = await fetchRandomWallhaven(strategy, current)

      // A newer click (or upload) already owns the UI — drop this result.
      if (seq !== requestSeqRef.current) return

      preloadImage(result.url)
      void warmWallpaperCache(result.url)
      storeWallpaper(result.url)
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
      if (seq !== requestSeqRef.current) return
      const fallback = pickFallbackWallpaper(current, favoriteItems)
      if (fallback) {
        warn('Random wallpaper unavailable, using fallback:', err)
        preloadImage(fallback)
        void warmWallpaperCache(fallback)
        storeWallpaper(fallback)
        setLastResult(null)
        showToast('排行榜暂时连不上，已换一张备用壁纸', 'info')
        return
      }
      logError('Random wallpaper failed:', err)
      const message = err instanceof Error && err.message ? err.message : '获取壁纸失败，请重试'
      showToast(message, 'error')
    } finally {
      // Only the latest request clears the spinner.
      if (seq === requestSeqRef.current) setRandomLoading(false)
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
    uploading,
    strategy,
    setStrategy,
    canFavoriteCurrent,
    alreadyFavorited,
    handleUpload,
    handleRandom,
    handleFavorite,
  }
}
