import { useRef } from 'react'
import { Upload, Shuffle, Check } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { PRESETS, randomDailyWallpaper } from '@/lib/wallpapers'
import { cn } from '@/lib/cn'
import { showToast } from '@/lib/toast'

const MAX_FILE_SIZE_MB = 5

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
  const fileRef = useRef<HTMLInputElement>(null)

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
      console.debug('Failed to read file as data URL')
    }
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

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong"
        >
          <Upload size={12} /> 上传
        </button>
        <button
          onClick={() => setWallpaper(randomDailyWallpaper())}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong"
        >
          <Shuffle size={12} /> 每日随机
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      <p className="text-[11px] text-text-tertiary">
图片存储在本地
      </p>
    </section>
  )
}
