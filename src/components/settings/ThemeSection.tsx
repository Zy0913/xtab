import { Sun, Moon, Monitor, Layers, Diamond, ZapOff, type LucideIcon } from 'lucide-react'
import { useSettingsStore, type ThemeMode, type GlassMode } from '@/store/useSettingsStore'
import { cn } from '@/lib/cn'

const THEME_OPTIONS: { value: ThemeMode; label: string; Icon: LucideIcon }[] = [
  { value: 'light', label: '浅色', Icon: Sun },
  { value: 'dark', label: '深色', Icon: Moon },
  { value: 'system', label: '跟随系统', Icon: Monitor },
]

const GLASS_OPTIONS: { value: GlassMode; label: string; Icon: LucideIcon; desc: string }[] = [
  { value: 'sequoia', label: 'Sequoia', Icon: Layers, desc: '经典毛玻璃' },
  { value: 'tahoe', label: 'Tahoe', Icon: Diamond, desc: '液态玻璃' },
]

export function ThemeSection() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const glassMode = useSettingsStore((s) => s.glassMode)
  const setGlassMode = useSettingsStore((s) => s.setGlassMode)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion)

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">主题</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-btn border py-3 text-xs transition',
                theme === value
                  ? 'bg-accent/20 border-accent text-text-primary'
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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          材质风格
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {GLASS_OPTIONS.map(({ value, label, Icon, desc }) => (
            <button
              key={value}
              onClick={() => setGlassMode(value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-btn border py-3 text-xs transition',
                glassMode === value
                  ? 'bg-accent/20 border-accent text-text-primary'
                  : 'border-border bg-surface text-text-primary hover:bg-surface-strong',
              )}
            >
              <Icon size={18} />
              <span className="font-medium">{label}</span>
              <span
                className={cn(
                  'text-[10px]',
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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          辅助功能
        </h3>
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
