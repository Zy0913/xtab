import { Cloud, CloudRain, CloudSnow, Sun, CloudFog, CloudLightning, type LucideIcon } from 'lucide-react'
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

export function WeatherWidget() {
  const { data, error } = useWeather()

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-tertiary" role="alert" aria-live="assertive">
        无法获取天气
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-tertiary" role="status" aria-live="polite">
        加载中…
      </div>
    )
  }

  const { Icon } = lookup(ICON_MAP, data.weatherCode, DEFAULT_ICON)
  const { label } = lookup(LABEL_MAP, data.weatherCode, DEFAULT_LABEL)

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          天气 · {data.location}{data.isFallback && ' *'}
        </span>
        <Icon size={16} className="text-text-tertiary" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-light tabular-nums text-text-primary">
          {data.temperature}
        </span>
        <span className="text-lg text-text-secondary">°C</span>
      </div>
      <div className="text-xs text-text-secondary">
        {label} · 风速 {Math.round(data.windspeed)} km/h
      </div>
      {data.isFallback && (
        <div className="mt-1 text-[10px] text-text-tertiary">* 定位不可用，显示默认城市</div>
      )}
    </div>
  )
}
