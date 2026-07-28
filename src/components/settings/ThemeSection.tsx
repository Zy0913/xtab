import { Sun, Moon, Monitor, Layers, Diamond, ZapOff, type LucideIcon } from 'lucide-react'
import { useSettingsStore, type ThemeMode, type GlassMode } from '@/store/useSettingsStore'
import { cn } from '@/lib/cn'

const THEME_OPTIONS: { value: ThemeMode; label: string; Icon: LucideIcon }[] = [
  { value: 'light', label: '浅色', Icon: Sun },
  { value: 'dark', label: '深色', Icon: Moon },
  { value: 'system', label: '跟随系统', Icon: Monitor },
]

const GLASS_OPTIONS: {
  value: GlassMode
  label: string
  Icon: LucideIcon
  desc: string
  preview: 'sequoia' | 'tahoe'
}[] = [
  { value: 'sequoia', label: 'Sequoia', Icon: Layers, desc: '经典毛玻璃', preview: 'sequoia' },
  { value: 'tahoe', label: 'Tahoe', Icon: Diamond, desc: '液态玻璃', preview: 'tahoe' },
]

/** Quiet material swatch — neutral backdrop + glass plate, no rainbow chrome. */
function GlassPreview({ mode }: { mode: 'sequoia' | 'tahoe' }) {
  const isTahoe = mode === 'tahoe'
  return (
    <div
      className="border-border/50 relative mb-2.5 h-11 w-full overflow-hidden rounded-btn border"
      style={{
        background: isTahoe
          ? 'linear-gradient(160deg, rgba(90,94,102,0.55) 0%, rgba(48,50,56,0.7) 100%)'
          : 'linear-gradient(160deg, rgba(72,74,80,0.65) 0%, rgba(40,42,46,0.85) 100%)',
      }}
      aria-hidden
    >
      {/* Soft depth shapes — same family as wallpapers, desaturated */}
      <div
        className="absolute -left-3 top-1 h-10 w-10 rounded-full opacity-40"
        style={{ background: 'rgba(255,255,255,0.12)', filter: 'blur(6px)' }}
      />
      <div
        className="absolute -right-2 bottom-0 h-8 w-14 rounded-full opacity-30"
        style={{ background: 'rgba(0,0,0,0.25)', filter: 'blur(8px)' }}
      />
      {/* Glass plate */}
      <div
        className="absolute inset-x-2.5 inset-y-2 rounded-[9px] border"
        style={{
          background: isTahoe ? 'rgba(255, 255, 255, 0.12)' : 'rgba(120, 120, 128, 0.38)',
          borderColor: isTahoe ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.12)',
          boxShadow: isTahoe
            ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 12px rgba(0,0,0,0.12)'
            : 'inset 0 0.5px 0 rgba(255,255,255,0.22), 0 2px 8px rgba(0,0,0,0.14)',
        }}
      />
    </div>
  )
}

export function ThemeSection() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const glassMode = useSettingsStore((s) => s.glassMode)
  const setGlassMode = useSettingsStore((s) => s.setGlassMode)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion)

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h3 className="widget-title">主题</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-btn border py-3 text-xs transition',
                theme === value
                  ? 'bg-accent/15 border-accent text-text-primary'
                  : 'border-border bg-surface text-text-primary hover:bg-surface-strong',
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="widget-title">材质风格</h3>
        <div className="grid grid-cols-2 gap-2">
          {GLASS_OPTIONS.map(({ value, label, Icon, desc, preview }) => (
            <button
              key={value}
              onClick={() => setGlassMode(value)}
              className={cn(
                'flex flex-col rounded-btn border p-2.5 text-left text-xs transition',
                glassMode === value
                  ? 'border-accent/80 bg-accent/12 text-text-primary'
                  : 'border-border bg-surface text-text-primary hover:bg-surface-strong',
              )}
            >
              <GlassPreview mode={preview} />
              <div className="flex items-center gap-1.5">
                <Icon size={14} className="text-text-secondary" />
                <span className="font-medium">{label}</span>
              </div>
              <span
                className={cn(
                  'mt-0.5 text-micro',
                  glassMode === value ? 'text-text-secondary' : 'text-text-tertiary',
                )}
              >
                {desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="widget-title">辅助功能</h3>
        <label className="flex cursor-pointer items-center justify-between rounded-btn border border-border bg-surface px-3 py-2.5 text-xs transition hover:bg-surface-strong">
          <span className="flex items-center gap-2 text-text-primary">
            <ZapOff size={14} />
            减少动效
          </span>
          <button
            type="button"
            onClick={() => setReduceMotion(!reduceMotion)}
            className={cn(
              'relative h-5 w-9 rounded-full transition',
              reduceMotion ? 'bg-accent' : 'bg-text-tertiary/40',
            )}
            aria-pressed={reduceMotion}
            aria-label="减少动效"
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
                reduceMotion ? 'left-[18px]' : 'left-0.5',
              )}
            />
          </button>
        </label>
      </div>
    </section>
  )
}
