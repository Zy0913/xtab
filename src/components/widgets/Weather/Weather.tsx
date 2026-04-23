import { Cloud, CloudRain, CloudSnow, Sun, CloudFog, CloudLightning, type LucideIcon } from 'lucide-react'
import { useWeather } from './useWeather'

function iconFor(code: number): LucideIcon {
  if (code === 0) return Sun
  if (code <= 3) return Cloud
  if (code <= 48) return CloudFog
  if (code <= 67) return CloudRain
  if (code <= 77) return CloudSnow
  if (code <= 82) return CloudRain
  if (code <= 99) return CloudLightning
  return Cloud
}

function labelFor(code: number): string {
  if (code === 0) return '晴'
  if (code <= 3) return '多云'
  if (code <= 48) return '雾'
  if (code <= 57) return '毛毛雨'
  if (code <= 67) return '雨'
  if (code <= 77) return '雪'
  if (code <= 82) return '阵雨'
  if (code <= 86) return '阵雪'
  if (code <= 99) return '雷暴'
  return '—'
}

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

  const Icon = iconFor(data.weatherCode)

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
        {labelFor(data.weatherCode)} · 风速 {Math.round(data.windspeed)} km/h
      </div>
      {data.isFallback && (
        <div className="mt-1 text-[10px] text-text-tertiary">* 定位不可用，显示默认城市</div>
      )}
    </div>
  )
}
