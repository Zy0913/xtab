import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudFog,
  CloudLightning,
  type LucideIcon,
} from 'lucide-react'
import { useWeather } from './useWeather'

const ICON_MAP: Array<{ maxCode: number; Icon: LucideIcon }> = [
  { maxCode: 0, Icon: Sun },
  { maxCode: 3, Icon: Cloud },
  { maxCode: 48, Icon: CloudFog },
  { maxCode: 67, Icon: CloudRain },
  { maxCode: 77, Icon: CloudSnow },
  { maxCode: 82, Icon: CloudRain },
  { maxCode: 99, Icon: CloudLightning },
]

const LABEL_MAP: Array<{ maxCode: number; label: string }> = [
  { maxCode: 0, label: '晴' },
  { maxCode: 3, label: '多云' },
  { maxCode: 48, label: '雾' },
  { maxCode: 57, label: '毛毛雨' },
  { maxCode: 67, label: '雨' },
  { maxCode: 77, label: '雪' },
  { maxCode: 82, label: '阵雨' },
  { maxCode: 86, label: '阵雪' },
  { maxCode: 99, label: '雷暴' },
]

function lookup<T extends { maxCode: number }>(map: T[], code: number, fallback: T): T {
  for (const entry of map) {
    if (code <= entry.maxCode) return entry
  }
  return fallback
}

const DEFAULT_ICON = ICON_MAP[ICON_MAP.length - 1]
const DEFAULT_LABEL = { maxCode: Infinity, label: '—' }

function getGradientClass(code: number, isDay: boolean): string {
  if (!isDay) {
    return 'bg-gradient-to-br from-slate-900/80 via-slate-950/85 to-indigo-950/65 border-white/5'
  }
  if (code === 0) {
    return 'bg-gradient-to-br from-sky-400/50 via-blue-500/35 to-indigo-950/45 border-white/10'
  }
  if (code <= 3) {
    return 'bg-gradient-to-br from-slate-500/45 via-blue-900/30 to-slate-900/50 border-white/10'
  }
  return 'bg-gradient-to-br from-slate-700/50 via-slate-800/40 to-slate-950/60 border-white/5'
}

export function WeatherWidget() {
  const { data, error } = useWeather()

  const cardClassName =
    'flex h-full w-full flex-col justify-between rounded-card p-4 shadow-card backdrop-blur-glass glass-noise border text-white select-none transition-all duration-500'

  if (error) {
    return (
      <div
        className={`${cardClassName} items-center justify-center border-white/5 bg-slate-900/40`}
      >
        <div className="text-sm text-white/50" role="alert" aria-live="assertive">
          无法获取天气
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div
        className={`${cardClassName} items-center justify-center border-white/5 bg-slate-900/40`}
      >
        <div className="animate-pulse text-sm text-white/50" role="status" aria-live="polite">
          加载中…
        </div>
      </div>
    )
  }

  const { Icon } = lookup(ICON_MAP, data.weatherCode, DEFAULT_ICON)
  const { label } = lookup(LABEL_MAP, data.weatherCode, DEFAULT_LABEL)

  // Gracefully handle partial/old cached entries
  const tempMax = data.tempMax !== undefined ? data.tempMax : data.temperature
  const tempMin = data.tempMin !== undefined ? data.tempMin : data.temperature
  const hourly = data.hourly || []

  const gradientClass = getGradientClass(data.weatherCode, data.isDay)

  return (
    <div className={`${cardClassName} ${gradientClass}`}>
      {/* Header section: Location + Navigation arrow (filled up-right), weather icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-white">
          <span>{data.location}</span>
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3 fill-current text-white/80"
            aria-hidden="true"
          >
            <path d="M21 3L3 10.53L11.47 12.53L13.47 21L21 3Z" />
          </svg>
          {data.isFallback && (
            <span
              className="cursor-help text-[10px] text-white/40"
              title="定位不可用，显示默认城市"
            >
              *
            </span>
          )}
        </div>
        <Icon size={26} className="text-white drop-shadow-sm" />
      </div>

      {/* Middle section: Temperature + stacked High/Low and weather description */}
      <div className="my-1 flex items-center justify-between">
        <div className="flex items-start">
          <span className="text-[52px] font-light tabular-nums leading-none tracking-tight text-white">
            {data.temperature}
          </span>
          <span className="-mt-0.5 text-2xl font-light leading-none text-white/90">°</span>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[13px] font-semibold text-white">{label}</span>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/80">
            <div className="flex items-center gap-0.5">
              <span className="flex flex-col text-[8px] font-medium leading-[1] text-white/50">
                <span>最</span>
                <span>高</span>
              </span>
              <span className="font-semibold tabular-nums">{tempMax}°</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="flex flex-col text-[8px] font-medium leading-[1] text-white/50">
                <span>最</span>
                <span>低</span>
              </span>
              <span className="font-semibold tabular-nums">{tempMin}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Bottom section: Hourly forecast */}
      <div className="scrollbar-none mt-1 flex items-center justify-between gap-1 overflow-x-auto">
        {hourly.slice(0, 6).map((item, index) => {
          const itemIconInfo = lookup(ICON_MAP, item.weatherCode, DEFAULT_ICON)
          const ItemIcon = itemIconInfo.Icon

          let hourLabel = '现在'
          if (index > 0) {
            const hour = parseInt(item.time.split('T')[1]?.split(':')[0] || '0', 10)
            hourLabel = `${hour}时`
          }

          return (
            <div
              key={item.time}
              className="flex min-w-[32px] flex-1 flex-col items-center justify-between gap-1.5"
            >
              <span className="whitespace-nowrap text-[10px] font-medium text-white/60">
                {hourLabel}
              </span>
              <ItemIcon size={16} className="text-white/80" />
              <span className="text-[11px] font-semibold tabular-nums text-white">
                {item.temperature}°
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
