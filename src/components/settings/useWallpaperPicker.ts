import { useMemo, useRef, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useFavoriteWallpapersStore } from '@/store/useFavoriteWallpapersStore'
import { fetchRandomWallhaven, type WallhavenResult, type WallhavenStrategy } from '@/lib/wallhaven'
import { showToast } from '@/lib/toast'
import { warn, error as logError } from '@/lib/logger'

const MAX_FILE_SIZE_MB = 5

const STRATEGY_LABEL: Record<WallhavenStrategy, string> = {
  '1d': '日榜',
  '1w': '周榜',
  '1M': '月榜',
  '1y': '年榜',
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
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
      setWallpaper(dataUrl)
    } catch {
      warn('Failed to read file as data URL')
    }
  }

  const handleRandom = async () => {
    if (randomLoading) return
    setRandomLoading(true)
    try {
      const result = await Promise.race([
        fetchRandomWallhaven(strategy),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ])
      setWallpaper(result.url)
      setLastResult(result)
      if (result.actualStrategy !== result.requestedStrategy) {
        showToast(
          `${STRATEGY_LABEL[result.requestedStrategy]}暂无符合条件的壁纸，已切换至${STRATEGY_LABEL[result.actualStrategy]}`,
          'info',
        )
      }
    } catch (err) {
      logError('Random wallpaper failed:', err)
      const message = err instanceof Error && err.message ? err.message : '获取壁纸失败，请重试'
      showToast(message, 'error')
    } finally {
      setRandomLoading(false)
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
