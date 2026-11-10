import { CloudOff } from 'lucide-react'
import { useWeather } from './useWeather'
import { CitySearch } from './CitySearch'
import { renderWeatherIcon } from './WeatherIcons'
import { WidgetEmpty } from '@/components/layout/WidgetEmpty'

/** WMO weather codes → the condition names Apple Weather uses in Chinese. */
const LABEL_MAP: Array<{ maxCode: number; label: string }> = [
  { maxCode: 0, label: '晴' },
  { maxCode: 1, label: '大部晴朗' },
  { maxCode: 2, label: '局部多云' },
  { maxCode: 3, label: '阴' },
  { maxCode: 45, label: '雾' },
  { maxCode: 48, label: '雾凇' },
  { maxCode: 55, label: '毛毛雨' },
  { maxCode: 57, label: '冻毛毛雨' },
  { maxCode: 61, label: '小雨' },
  { maxCode: 63, label: '中雨' },
  { maxCode: 65, label: '大雨' },
  { maxCode: 67, label: '冻雨' },
  { maxCode: 71, label: '小雪' },
  { maxCode: 73, label: '中雪' },
  { maxCode: 75, label: '大雪' },
  { maxCode: 77, label: '米雪' },
  { maxCode: 82, label: '阵雨' },
  { maxCode: 86, label: '阵雪' },
  { maxCode: 95, label: '雷雨' },
  { maxCode: 99, label: '雷雨伴冰雹' },
]

function lookupLabel(code: number): string {
  for (const entry of LABEL_MAP) {
    if (code <= entry.maxCode) return entry.label
  }
  return '—'
}

/** "现在" for the current hour, then "15时", as Apple Weather labels them. */
function hourLabel(iso: string, index: number): string {
  if (index === 0) return '现在'
  const hour = Number(iso.split('T')[1]?.slice(0, 2))
  return Number.isFinite(hour) ? `${hour}时` : '—'
}

/** Redacted placeholders in the shape of the widget, as WidgetKit shows them. */
function WeatherSkeleton() {
  return (
    <div className="weather" role="status" aria-label="正在加载天气">
      <div className="weather-head flex items-start justify-between gap-3">
        <div className="pt-1.5">
          <div className="h-4 w-14 rounded-full bg-fill" />
          <div className="mt-3 h-9 w-16 rounded-[10px] bg-fill" />
        </div>
        <div className="flex flex-col items-end gap-2 pt-1">
          <div className="h-5 w-5 rounded-full bg-fill" />
          <div className="h-3 w-10 rounded-full bg-fill" />
          <div className="h-3 w-24 rounded-full bg-fill" />
        </div>
      </div>
      <div className="weather-hourly">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-2.5 w-6 rounded-full bg-fill" />
            <div className="h-5 w-5 rounded-full bg-fill" />
            <div className="h-2.5 w-5 rounded-full bg-fill" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Apple Weather's medium widget: city and current temperature on the left,
 * condition and today's range on the right, the next hours along the bottom.
 * A wide card puts the hours beside the summary instead (see `.weather`).
 */
export function WeatherWidget() {
  const { data, error } = useWeather()

  // Cached data beats an error message while the hook keeps retrying.
  if (!data) {
    if (error) {
      return (
        <div role="alert" className="flex h-full flex-col">
          <WidgetEmpty
            icon={<CloudOff size={18} strokeWidth={1.75} />}
            title="无法获取天气"
            description="恢复联网后会自动重试"
          />
        </div>
      )
    }
    return <WeatherSkeleton />
  }

  const today = data.daily?.[0]
  const hourly = (data.hourly ?? []).slice(0, 6)

  return (
    <div className="weather select-none">
      <div className="weather-head flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CitySearch currentCity={data.location} />
          <p className="mt-0.5 text-[2.75rem] font-light tabular-nums leading-none tracking-[-0.02em] text-text-primary">
            {Math.round(data.temperature)}°
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end pt-1 text-right">
          {renderWeatherIcon(data.weatherCode, 20, 'text-text-primary', data.isDay)}
          <p className="mt-1.5 text-body font-semibold leading-snug text-text-primary">
            {lookupLabel(data.weatherCode)}
          </p>
          {today && (
            <p className="text-body font-medium tabular-nums leading-snug text-text-secondary">
              最高 {today.tempMax}° 最低 {today.tempMin}°
            </p>
          )}
        </div>
      </div>

      {hourly.length > 0 && (
        <ol className="weather-hourly" aria-label="逐小时预报">
          {hourly.map((item, index) => {
            // "现在" repeats the current reading rather than the hour's
            // forecast, so it always agrees with the big temperature.
            const now = index === 0
            return (
              <li key={item.time} className="flex flex-col items-center gap-1.5">
                <span className="text-caption font-semibold leading-none text-text-secondary">
                  {hourLabel(item.time, index)}
                </span>
                <span className="flex h-5 items-center">
                  {renderWeatherIcon(
                    now ? data.weatherCode : item.weatherCode,
                    20,
                    'text-text-primary',
                    now ? data.isDay : (item.isDay ?? true),
                  )}
                </span>
                <span className="text-body font-semibold tabular-nums leading-none text-text-primary">
                  {Math.round(now ? data.temperature : item.temperature)}°
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
