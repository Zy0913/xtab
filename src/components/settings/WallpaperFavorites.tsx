import { X, Check } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useFavoriteWallpapersStore } from '@/store/useFavoriteWallpapersStore'
import { cn } from '@/lib/cn'

export function WallpaperFavorites() {
  const items = useFavoriteWallpapersStore((s) => s.items)
  const remove = useFavoriteWallpapersStore((s) => s.remove)
  const current = useSettingsStore((s) => s.wallpaper)
  const setWallpaper = useSettingsStore((s) => s.setWallpaper)

  if (items.length === 0) return null

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-medium text-text-secondary">我的收藏</h4>
        <span className="text-[10px] text-text-tertiary">{items.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const active = current === item.url
          return (
            <div key={item.id} className="group relative aspect-video">
              <button
                onClick={() => setWallpaper(item.url)}
                className={cn(
                  'h-full w-full overflow-hidden rounded-btn border-2 transition',
                  active ? 'border-accent' : 'border-transparent hover:border-border',
                )}
                aria-label={`使用收藏壁纸 ${item.id}`}
                title={item.resolution ? `${item.id} · ${item.resolution}` : item.id}
              >
                <img
                  src={item.thumb}
                  alt={item.id}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
              {active && (
                <span className="pointer-events-none absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                  <Check size={10} />
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  remove(item.id)
                }}
                className="absolute left-1 top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 group-hover:flex"
                aria-label="移除收藏"
                title="移除收藏"
              >
                <X size={10} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
