import { useWeather } from './useWeather'
import { CitySearch } from './CitySearch'
import { renderWeatherIcon } from './WeatherIcons'

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

function lookupLabel(code: number): string {
  for (const entry of LABEL_MAP) {
    if (code <= entry.maxCode) return entry.label
  }
  return '—'
}

export function WeatherWidget() {
  const { data, error } = useWeather()

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-sm text-text-tertiary" role="alert" aria-live="assertive">
          无法获取天气
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="animate-pulse text-sm text-text-tertiary" role="status" aria-live="polite">
          加载中…
        </p>
      </div>
    )
  }

  const label = lookupLabel(data.weatherCode)
  const hourly = data.hourly || []

  const today = data.daily[0]
  const tempMax = today?.tempMax ?? data.temperature
  const tempMin = today?.tempMin ?? data.temperature
  const maxCode = today?.weatherCode ?? data.weatherCode
  const minCode = data.daily[1]?.weatherCode ?? maxCode

  return (
    <div className="flex w-full select-none flex-col gap-2">
      {/* Top: Location + Temperature + Condition/High-Low */}
      <div>
        {/* Location */}
        <div className="mb-2 flex items-center">
          <CitySearch currentCity={data.location} />
        </div>

        {/* Temperature (left) + Condition & High/Low (right) */}
        <div className="flex items-start justify-between">
          {/* Left: Large temperature */}
          <div className="flex items-start leading-none">
            <span className="text-[48px] font-light tabular-nums tracking-tight text-text-primary">
              {data.temperature}
            </span>
            <span className="mt-0.5 text-xl font-light text-text-secondary">°</span>
          </div>

          {/* Right: Condition + High/Low */}
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="flex items-center gap-2">
              {renderWeatherIcon(data.weatherCode, 30)}
              <span className="text-[14px] font-medium text-text-primary">{label}</span>
            </div>
            <div className="flex items-center gap-4 text-[12px]">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-medium text-text-tertiary">最高</span>
                {renderWeatherIcon(maxCode, 14)}
                <span className="font-semibold tabular-nums text-text-secondary">{tempMax}°</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-medium text-text-tertiary">最低</span>
                {renderWeatherIcon(minCode, 14)}
                <span className="font-semibold tabular-nums text-text-secondary">{tempMin}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Hourly forecast */}
      <div className="scrollbar-none flex items-center justify-between gap-1 overflow-x-auto">
        {hourly.slice(0, 6).map((item, index) => {
          let hourLabel = '现在'
          if (index > 0) {
            const hour = parseInt(item.time.split('T')[1]?.split(':')[0] || '0', 10)
            hourLabel = `${hour}时`
          }

          return (
            <div key={item.time} className="flex min-w-[44px] flex-1 flex-col items-center gap-1.5">
              <span className="whitespace-nowrap text-[11px] font-medium text-text-tertiary">
                {hourLabel}
              </span>
              {renderWeatherIcon(item.weatherCode, 24)}
              <span className="text-[13px] font-semibold tabular-nums text-text-primary">
                {item.temperature}°
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
