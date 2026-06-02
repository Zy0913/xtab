import { RotateCcw, Download, Upload } from 'lucide-react'
import { useLayoutStore } from '@/store/useLayoutStore'
import { cn } from '@/lib/cn'
import { WIDGET_LABELS, type WidgetId } from '@/types/widget'
import { useBackupRestore } from './useBackupRestore'

const ALL_IDS = Object.keys(WIDGET_LABELS) as WidgetId[]

export function LayoutSection() {
  const enabled = useLayoutStore((s) => s.enabled)
  const toggleWidget = useLayoutStore((s) => s.toggleWidget)
  const resetLayout = useLayoutStore((s) => s.reset)

  const { handleExport, handleImport } = useBackupRestore()

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">组件</h3>

      <div className="space-y-1 rounded-card bg-surface p-2">
        {ALL_IDS.map((id) => {
          const on = enabled.includes(id)
          return (
            <label
              key={id}
              className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-surface-strong"
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

      <div className="grid grid-cols-3 gap-2 pt-2">
        <button
          onClick={resetLayout}
          className="flex items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong"
        >
          <RotateCcw size={12} /> 重置
        </button>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong"
        >
          <Download size={12} /> 导出
        </button>
        <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong">
          <Upload size={12} /> 导入
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
      </div>
    </section>
  )
}
