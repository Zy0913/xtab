import { Upload, Shuffle, Check, Loader, Heart } from 'lucide-react'
import { PRESETS } from '@/lib/wallpapers'
import { type WallhavenStrategy } from '@/lib/wallhaven'
import { cn } from '@/lib/cn'
import { WallpaperFavorites } from './WallpaperFavorites'
import { useWallpaperPicker } from './useWallpaperPicker'

const STRATEGIES: { key: WallhavenStrategy; label: string }[] = [
  { key: '1d', label: '日榜' },
  { key: '1w', label: '周榜' },
  { key: '1M', label: '月榜' },
  { key: '1y', label: '年榜' },
]

export function WallpaperPicker() {
  const {
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
  } = useWallpaperPicker()

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">壁纸</h3>

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
                ? 'bg-accent/20 ring-accent/30 text-text-primary ring-1'
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
          {randomLoading ? <Loader size={12} className="animate-spin" /> : <Shuffle size={12} />}{' '}
          随机排行榜
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
          <span className="tabular-nums text-text-tertiary">{Math.round(dimming * 100)}%</span>
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

      <p className="text-[11px] text-text-tertiary">图片通过本地缓存加载，重复打开秒开</p>
    </section>
  )
}
