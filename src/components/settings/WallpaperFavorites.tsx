import { X } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useFavoriteWallpapersStore } from '@/store/useFavoriteWallpapersStore'
import { WallpaperThumb } from './WallpaperThumb'

export function WallpaperFavorites() {
  const items = useFavoriteWallpapersStore((s) => s.items)
  const remove = useFavoriteWallpapersStore((s) => s.remove)
  const current = useSettingsStore((s) => s.wallpaper)
  const setWallpaper = useSettingsStore((s) => s.setWallpaper)

  if (items.length === 0) return null

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-baseline justify-between px-1 text-caption text-text-secondary">
        <h4 className="font-medium">我的收藏</h4>
        <span className="tabular-nums">{items.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {items.map((item) => (
          <WallpaperThumb
            key={item.id}
            src={item.thumb}
            label={`使用收藏壁纸 ${item.id}`}
            title={item.resolution ? `${item.id} · ${item.resolution}` : item.id}
            selected={current === item.url}
            onSelect={() => setWallpaper(item.url)}
          >
            {/* Launchpad-style delete badge: shown on hover, keyboard focus, or touch screens. */}
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="material-pop absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-text-primary opacity-0 transition-[opacity,transform] duration-fast after:absolute after:-inset-1 after:content-[''] hover:scale-110 focus-visible:opacity-100 active:scale-95 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              aria-label="移除收藏"
              title="移除收藏"
            >
              <X size={10} strokeWidth={3} />
            </button>
          </WallpaperThumb>
        ))}
      </div>
    </div>
  )
}
