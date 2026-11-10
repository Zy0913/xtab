import {
  Bookmark,
  Clock,
  CloudSun,
  LayoutGrid,
  ListChecks,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { useLayoutStore } from '@/store/useLayoutStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Switch } from '@/components/ui/Switch'
import { WIDGET_LABELS, type WidgetId } from '@/types/widget'
import { SettingsSection } from './SettingsSection'

const ALL_IDS = Object.keys(WIDGET_LABELS) as WidgetId[]

/* Coloured squircle icons, as in the System Settings sidebar. */
const WIDGET_ICONS: Record<WidgetId, { Icon: LucideIcon; color: string }> = {
  search: { Icon: Search, color: 'rgb(0 122 255)' },
  clock: { Icon: Clock, color: 'rgb(255 149 0)' },
  shortcuts: { Icon: LayoutGrid, color: 'rgb(88 86 214)' },
  weather: { Icon: CloudSun, color: 'rgb(50 173 230)' },
  todo: { Icon: ListChecks, color: 'rgb(52 199 89)' },
  bookmarks: { Icon: Bookmark, color: 'rgb(255 45 85)' },
}

export function LayoutSection() {
  const enabled = useLayoutStore((s) => s.enabled)
  const toggleWidget = useLayoutStore((s) => s.toggleWidget)
  const showSeconds = useSettingsStore((s) => s.showSeconds)
  const setShowSeconds = useSettingsStore((s) => s.setShowSeconds)

  return (
    <SettingsSection title="组件">
      {/* Separators start at the label: 12px padding + 22px icon + 10px gap. */}
      <div className="form-group [--row-inset:44px]">
        {ALL_IDS.map((id) => {
          const { Icon, color } = WIDGET_ICONS[id]
          return (
            <label key={id} className="form-row">
              <span
                aria-hidden
                className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] text-white shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.1)]"
                style={{ backgroundColor: color }}
              >
                <Icon size={13} strokeWidth={2.25} />
              </span>
              <span className="flex-1">{WIDGET_LABELS[id]}</span>
              <Switch checked={enabled.includes(id)} onChange={() => toggleWidget(id)} />
            </label>
          )
        })}
      </div>

      <div className="form-group">
        <label className="form-row">
          <span className="flex-1">时钟显示秒数</span>
          <Switch checked={showSeconds} onChange={setShowSeconds} />
        </label>
      </div>
    </SettingsSection>
  )
}
