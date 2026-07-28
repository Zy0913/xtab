import { useWeather } from './useWeather'
import { CitySearch } from './CitySearch'
import { renderWeatherIcon } from './WeatherIcons'

const LABEL_MAP: Array<{ maxCode: number; label: string }> = [
  { maxCode: 0, label: '晴' },
  { maxCode: 3, label: '多云' },
  { maxCode: 45, label: '雾' },
  { maxCode: 48, label: '雾凇' },
  { maxCode: 55, label: '毛毛雨' },
  { maxCode: 57, label: '冻毛毛雨' },
  { maxCode: 65, label: '雨' },
  { maxCode: 67, label: '冻雨' },
  { maxCode: 75, label: '雪' },
  { maxCode: 77, label: '米雪' },
  { maxCode: 82, label: '阵雨' },
  { maxCode: 86, label: '阵雪' },
  { maxCode: 95, label: '雷雨' },
  { maxCode: 99, label: '雷暴' },
]

function lookupLabel(code: number): string {
  for (const entry of LABEL_MAP) {
    if (code <= entry.maxCode) return entry.label
  }
  return '—'
}

/** Format hourly time like macOS: "16:00" / "19:07" */
function formatHourLabel(iso: string, isFirst: boolean, now: Date): string {
  const part = iso.split('T')[1] || '00:00'
  const [hh, mm] = part.split(':')
  if (isFirst) {
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }
  return `${hh}:${mm ?? '00'}`
}

/**
 * Proportion system (tuned against macOS desktop weather):
 * - Location ~12–13px, pin 11
 * - Hero temp ~50–52px light; degree ~40% of that
 * - Condition icon 22–24 (top-right); label 13–14 under it
 * - Hourly: time 10.5 · icon 18 · temp 12.5; tight 6px stack
 */
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
  const hourly = (data.hourly || []).slice(0, 6)
  const now = new Date()

  return (
    <div className="flex h-full w-full select-none flex-col">
      {/* ── Header row: location left · condition stack right ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pt-px">
          <CitySearch currentCity={data.location} />
        </div>
        <div className="flex w-[3.25rem] shrink-0 flex-col items-center gap-0.5">
          {renderWeatherIcon(data.weatherCode, 24, 'text-text-primary opacity-[0.88]')}
        </div>
      </div>

      {/* ── Hero: temp dominates left; condition label under the icon column ── */}
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="flex items-start leading-none">
          <span
            className="font-extralight tabular-nums tracking-[-0.03em] text-text-primary"
            style={{ fontSize: 'clamp(2.75rem, 7.5cqw, 3.25rem)' }}
          >
            {Math.round(data.temperature)}
          </span>
          <span
            className="text-text-primary/65 ml-0.5 mt-[0.35em] font-light"
            style={{ fontSize: 'clamp(1.15rem, 3.2cqw, 1.35rem)' }}
          >
            °
          </span>
        </div>
        <div className="flex w-[3.25rem] shrink-0 flex-col items-center pb-1">
          <span className="text-text-primary/88 text-center text-[13px] font-medium leading-tight tracking-wide">
            {label}
          </span>
        </div>
      </div>

      {/* ── Hourly: equal columns, compact optical rhythm ── */}
      <div className="mt-auto grid grid-cols-6 gap-x-0.5 pt-4">
        {hourly.map((item, index) => (
          <div key={item.time} className="flex flex-col items-center">
            <span className="text-text-secondary/85 text-[10.5px] font-medium tabular-nums leading-none tracking-tight">
              {formatHourLabel(item.time, index === 0, now)}
            </span>
            <div className="mt-[7px] flex h-[18px] items-center justify-center">
              {renderWeatherIcon(item.weatherCode, 18, 'text-text-primary opacity-80')}
            </div>
            <span className="mt-[6px] text-[12.5px] font-medium tabular-nums leading-none text-text-primary">
              {Math.round(item.temperature)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
