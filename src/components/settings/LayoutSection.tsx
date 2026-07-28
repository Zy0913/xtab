import { RotateCcw, Download, Upload, Sparkles } from 'lucide-react'
import { useLayoutStore } from '@/store/useLayoutStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { cn } from '@/lib/cn'
import { WIDGET_LABELS, type WidgetId } from '@/types/widget'
import { useBackupRestore } from './useBackupRestore'

const ALL_IDS = Object.keys(WIDGET_LABELS) as WidgetId[]

interface Props {
  onRequestClose?: () => void
}

export function LayoutSection({ onRequestClose }: Props = {}) {
  const enabled = useLayoutStore((s) => s.enabled)
  const toggleWidget = useLayoutStore((s) => s.toggleWidget)
  const resetLayout = useLayoutStore((s) => s.reset)
  const resetOnboarding = useSettingsStore((s) => s.resetOnboarding)

  const { handleExport, handleImport } = useBackupRestore()

  const handleReset = () => {
    if (window.confirm('将恢复默认布局与组件开关，确定继续？')) {
      resetLayout()
    }
  }

  const handleReplayOnboarding = () => {
    onRequestClose?.()
    // Let the drawer start closing before the overlay mounts.
    window.setTimeout(() => resetOnboarding(), 120)
  }

  return (
    <section className="space-y-3">
      <h3 className="widget-title">组件</h3>

      <div className="border-border/60 space-y-0.5 rounded-card border bg-surface p-1.5">
        {ALL_IDS.map((id) => {
          const on = enabled.includes(id)
          return (
            <label
              key={id}
              className="flex items-center justify-between rounded-btn px-2.5 py-2 text-sm transition hover:bg-surface-strong"
            >
              <span className="text-text-primary">{WIDGET_LABELS[id]}</span>
              <button
                type="button"
                onClick={() => toggleWidget(id)}
                className={cn(
                  'relative h-5 w-9 rounded-full transition',
                  on ? 'bg-accent' : 'bg-text-tertiary/40',
                )}
                aria-pressed={on}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
                    on ? 'left-[18px]' : 'left-0.5',
                  )}
                />
              </button>
            </label>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary transition hover:bg-surface-strong"
        >
          <Download size={12} /> 导出
        </button>
        <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary transition hover:bg-surface-strong">
          <Upload size={12} /> 导入
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
      </div>

      <button
        onClick={handleReset}
        className="border-border/70 flex w-full items-center justify-center gap-1.5 rounded-btn border py-2 text-xs text-text-tertiary transition hover:border-danger-border hover:bg-danger-soft hover:text-danger"
      >
        <RotateCcw size={12} /> 重置布局
      </button>

      <button
        type="button"
        onClick={handleReplayOnboarding}
        className="flex w-full items-center justify-center gap-1.5 py-1.5 text-micro text-text-tertiary transition hover:text-text-secondary"
      >
        <Sparkles size={11} /> 重新体验引导
      </button>
    </section>
  )
}
