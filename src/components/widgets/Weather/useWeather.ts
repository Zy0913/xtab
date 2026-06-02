import { useEffect, useState } from 'react'
import { useWeatherCityStore, type SelectedCity } from '@/store/useWeatherCityStore'

export interface CitySearchResult {
  name: string
  country: string
  latitude: number
  longitude: number
}

interface HourlyForecast {
  time: string
  temperature: number
  weatherCode: number
}

interface DailyForecast {
  date: string
  tempMax: number
  tempMin: number
  weatherCode: number
}

interface WeatherData {
  location: string
  temperature: number
  weatherCode: number
  isDay: boolean
  hourly: HourlyForecast[]
  daily: DailyForecast[]
}

interface CacheEntry {
  city: SelectedCity
  weather: WeatherData
  ts: number
}

const DEFAULT_CITY: SelectedCity = { name: '北京', latitude: 39.9042, longitude: 116.4074 }
const CACHE_KEY = 'tab:weather-cache-v3'
const FRESH_MS = 15 * 60 * 1000
const REFRESH_MS = 15 * 60 * 1000

const hasChromeStorage = typeof chrome !== 'undefined' && !!chrome.storage?.local

async function readCache<T>(key: string): Promise<T | null> {
  if (!hasChromeStorage) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }
  const r = await chrome.storage.local.get(key)
  return (r[key] as T | undefined) ?? null
}

async function writeCache(key: string, value: unknown): Promise<void> {
  if (!hasChromeStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
    return
  }
  await chrome.storage.local.set({ [key]: value })
}

/**
 * Search cities using Open-Meteo Geocoding API (free, no key required).
 */
export async function searchCities(
  query: string,
  signal?: AbortSignal,
): Promise<CitySearchResult[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=zh`,
      { signal },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).map(
      (r: { name: string; country?: string; latitude: number; longitude: number }) => ({
        name: r.name,
        country: r.country ?? '',
        latitude: r.latitude,
        longitude: r.longitude,
      }),
    )
  } catch {
    return []
  }
}

async function fetchWeather(city: SelectedCity, signal?: AbortSignal): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=5`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`天气服务不可用 (HTTP ${res.status})`)
  const data = await res.json()
  const cw = data.current_weather

  // Extract hourly forecasts (up to 6 hours)
  const hourly: HourlyForecast[] = []
  if (data.hourly?.time && data.hourly?.temperature_2m && data.hourly?.weathercode) {
    let currentIndex = data.hourly.time.indexOf(cw.time)
    if (currentIndex === -1) {
      const hourPrefix = cw.time.substring(0, 13)
      currentIndex = data.hourly.time.findIndex((t: string) => t.startsWith(hourPrefix))
    }
    if (currentIndex === -1) {
      currentIndex = 0
    }
    for (let i = 0; i < 6; i++) {
      const idx = currentIndex + i
      if (idx < data.hourly.time.length) {
        hourly.push({
          time: data.hourly.time[idx],
          temperature: Math.round(data.hourly.temperature_2m[idx]),
          weatherCode: data.hourly.weathercode[idx],
        })
      }
    }
  }

  // Extract daily forecasts
  const daily: DailyForecast[] = []
  if (data.daily?.time && data.daily?.temperature_2m_max && data.daily?.temperature_2m_min) {
    for (let i = 0; i < Math.min(5, data.daily.time.length); i++) {
      daily.push({
        date: data.daily.time[i],
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        weatherCode: data.daily.weathercode?.[i] ?? 0,
      })
    }
  }

  return {
    location: city.name,
    temperature: Math.round(cw.temperature),
    weatherCode: cw.weathercode,
    isDay: cw.is_day === 1,
    hourly,
    daily,
  }
}

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()

    const refresh = async () => {
      try {
        const city = useWeatherCityStore.getState().selectedCity ?? DEFAULT_CITY
        const weather = await fetchWeather(city, ctrl.signal)
        if (!alive) return
        setData(weather)
        setError(null)
        void writeCache(CACHE_KEY, { city, weather, ts: Date.now() })
      } catch (e) {
        if (!alive || (e instanceof DOMException && e.name === 'AbortError')) return
        setError(e instanceof Error ? e.message : '天气加载失败')
      }
    }

    // Boot from cache
    ;(async () => {
      const cached = await readCache<CacheEntry>(CACHE_KEY)
      if (cached && alive) {
        setData(cached.weather)
        if (Date.now() - cached.ts < FRESH_MS) return
      }
      await refresh()
    })()

    const timer = setInterval(refresh, REFRESH_MS)

    // Re-fetch when selected city changes
    const unsub = useWeatherCityStore.subscribe(() => {
      refresh()
    })

    return () => {
      alive = false
      ctrl.abort()
      clearInterval(timer)
      unsub()
    }
  }, [])

  return { data, error }
}
