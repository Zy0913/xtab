import { useMemo, useRef, useState } from 'react'
import { Upload, Shuffle, Check, Loader, Heart } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useFavoriteWallpapersStore } from '@/store/useFavoriteWallpapersStore'
import { PRESETS } from '@/lib/wallpapers'
import {
  fetchRandomWallhaven,
  type WallhavenResult,
  type WallhavenStrategy,
} from '@/lib/wallhaven'
import { cn } from '@/lib/cn'
import { showToast } from '@/lib/toast'
import { WallpaperFavorites } from './WallpaperFavorites'

const MAX_FILE_SIZE_MB = 5

const STRATEGIES: { key: WallhavenStrategy; label: string }[] = [
  { key: '1d', label: '日榜' },
  { key: '1w', label: '周榜' },
  { key: '1M', label: '月榜' },
  { key: '1y', label: '年榜' },
]

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

export function WallpaperPicker() {
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
      console.warn('Failed to read file as data URL')
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
      console.error('Random wallpaper failed:', err)
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

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
        壁纸
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setWallpaper(p.url)}
            className={cn(
              'group relative aspect-video overflow-hidden rounded-btn border-2 transition',
              current === p.url ? 'border-accent' : 'border-transparent hover:border-border',
            )}
            aria-label={p.name}
          >
            <img src={p.thumb} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
            {current === p.url && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                <Check size={10} />
              </span>
            )}
          </button>
        ))}
      </div>

      <WallpaperFavorites />

      <div className="flex gap-1.5 pt-1">
        {STRATEGIES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStrategy(s.key)}
            disabled={randomLoading}
            className={cn(
              'rounded-btn px-2 py-1 text-[11px] transition',
              strategy === s.key
                ? 'bg-accent/20 text-text-primary ring-1 ring-accent/30'
                : 'bg-surface text-text-secondary hover:text-text-primary',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong"
        >
          <Upload size={12} /> 上传
        </button>
        <button
          onClick={handleRandom}
          disabled={randomLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong disabled:opacity-50"
        >
          {randomLoading ? <Loader size={12} className="animate-spin" /> : <Shuffle size={12} />} 随机排行榜
        </button>
        <button
          onClick={handleFavorite}
          disabled={!canFavoriteCurrent || alreadyFavorited}
          title={
            !canFavoriteCurrent
              ? '随机一张壁纸后可收藏'
              : alreadyFavorited
                ? '已收藏'
                : '收藏当前壁纸'
          }
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-btn px-3 py-2 text-xs transition',
            'bg-surface text-text-primary hover:bg-surface-strong disabled:opacity-50',
            alreadyFavorited && 'text-rose-500',
          )}
          aria-label="收藏当前壁纸"
        >
          <Heart size={12} fill={alreadyFavorited ? 'currentColor' : 'none'} />
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-[11px] text-text-secondary">
          <span>壁纸暗化</span>
          <span className="tabular-nums text-text-tertiary">
            {Math.round(dimming * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={60}
          step={5}
          value={Math.round(dimming * 100)}
          onChange={(e) => setDimming(Number(e.target.value) / 100)}
          aria-label="壁纸暗化强度"
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface accent-accent"
        />
        <p className="text-[10px] text-text-tertiary">
          壁纸偏亮或偏花时拉高，提升时钟与组件的可读性
        </p>
      </div>

      <p className="text-[11px] text-text-tertiary">
        图片通过本地缓存加载，重复打开秒开
      </p>
    </section>
  )
}
