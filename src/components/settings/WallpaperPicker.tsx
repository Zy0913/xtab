import { Upload, Shuffle, Loader, Heart } from 'lucide-react'
import { PRESETS } from '@/lib/wallpapers'
import { type WallhavenStrategy } from '@/lib/wallhaven'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl'
import { Slider } from '@/components/ui/Slider'
import { WallpaperFavorites } from './WallpaperFavorites'
import { WallpaperThumb } from './WallpaperThumb'
import { RowLabel, SettingsSection } from './SettingsSection'
import { useWallpaperPicker } from './useWallpaperPicker'

const STRATEGIES: SegmentOption<WallhavenStrategy>[] = [
  { value: '1d', label: '日榜' },
  { value: '1w', label: '周榜' },
  { value: '1M', label: '月榜' },
  { value: '1y', label: '年榜' },
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

  const dimPercent = Math.round(dimming * 100)

  return (
    <SettingsSection title="壁纸">
      <div className="grid grid-cols-3 gap-2.5">
        {PRESETS.map((p) => (
          <WallpaperThumb
            key={p.id}
            src={p.thumb}
            label={p.name}
            selected={current === p.url}
            onSelect={() => setWallpaper(p.url)}
          />
        ))}
      </div>

      <WallpaperFavorites />

      <div className="form-group">
        <div className="form-row">
          <span className="flex-1">排行榜</span>
          <SegmentedControl
            aria-label="排行榜范围"
            value={strategy}
            options={STRATEGIES}
            onChange={setStrategy}
            disabled={randomLoading}
            className="w-52"
          />
        </div>
        <div className="form-row">
          <RowLabel label="随机壁纸" description="来自 Wallhaven 排行榜" />
          <button
            type="button"
            onClick={handleFavorite}
            disabled={!canFavoriteCurrent || alreadyFavorited}
            aria-pressed={alreadyFavorited}
            aria-label="收藏当前壁纸"
            title={
              !canFavoriteCurrent
                ? '随机一张壁纸后可收藏'
                : alreadyFavorited
                  ? '已收藏'
                  : '收藏当前壁纸'
            }
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-fast disabled:pointer-events-none',
              alreadyFavorited
                ? 'text-danger'
                : 'text-text-secondary hover:bg-fill hover:text-text-primary',
              !canFavoriteCurrent && 'opacity-40',
            )}
          >
            <Heart size={15} fill={alreadyFavorited ? 'currentColor' : 'none'} />
          </button>
          <Button
            size="sm"
            onClick={handleRandom}
            disabled={randomLoading}
            aria-busy={randomLoading || undefined}
            className="disabled:opacity-100"
          >
            {randomLoading ? (
              <Loader size={13} className="animate-spin" aria-hidden />
            ) : (
              <Shuffle size={13} aria-hidden />
            )}
            换一张
          </Button>
        </div>
        <div className="form-row">
          <RowLabel label="本地图片" description="不超过 5MB" />
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={13} aria-hidden />
            选取…
          </Button>
        </div>
      </div>

      <div className="form-group">
        <div className="form-row flex-col items-stretch gap-1.5 pb-3 pt-2.5">
          <span className="flex items-center justify-between" aria-hidden>
            <span>暗化</span>
            <span className="tabular-nums text-text-secondary">{dimPercent}%</span>
          </span>
          <Slider
            aria-label="壁纸暗化强度"
            aria-valuetext={`${dimPercent}%`}
            min={0}
            max={0.6}
            step={0.05}
            value={dimming}
            onChange={setDimming}
          />
        </div>
      </div>
      <p className="px-1 text-caption text-text-secondary">
        壁纸偏亮或偏花时调高暗化，时钟和组件会更易读。图片缓存在本地，再次打开无需等待。
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </SettingsSection>
  )
}
