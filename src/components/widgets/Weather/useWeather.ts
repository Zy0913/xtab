import { useEffect, useState } from 'react'
import { warn } from '@/lib/logger'

interface GeocodeResult {
  name: string
  latitude: number
  longitude: number
  country?: string
}

interface HourlyForecast {
  time: string
  temperature: number
  weatherCode: number
}

interface WeatherData {
  location: string
  temperature: number
  windspeed: number
  weatherCode: number
  isDay: boolean
  isFallback: boolean
  tempMax: number
  tempMin: number
  hourly: HourlyForecast[]
}

interface LocResult extends GeocodeResult {
  isFallback: boolean
}

interface CacheEntry {
  loc: LocResult
  weather: WeatherData
  ts: number
}

const DEFAULT_CITY = { name: '北京', latitude: 39.9042, longitude: 116.4074 }
const CACHE_KEY = 'tab:weather-cache'
const GEOCODE_CACHE_KEY = 'tab:geocode-cache'
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

// Round lat/lng to ~1km so small movements don't bust the cache
function geocodeKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`
}

async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<string> {
  const key = geocodeKey(lat, lon)
  const cache = (await readCache<Record<string, string>>(GEOCODE_CACHE_KEY)) ?? {}
  if (cache[key]) return cache[key]

  try {
    // BigDataCloud client endpoint: no key, CORS-enabled, unlimited free.
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
      { signal },
    )
    if (res.ok) {
      const data = await res.json()
      const name: string =
        data?.city ||
        data?.locality ||
        data?.principalSubdivision ||
        data?.countryName ||
        '当前位置'
      cache[key] = name
      await writeCache(GEOCODE_CACHE_KEY, cache)
      return name
    }
  } catch {
    warn('Reverse geocoding failed')
  }
  return '当前位置'
}

async function getLocation(signal?: AbortSignal): Promise<LocResult> {
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 4000,
        maximumAge: 1000 * 60 * 60,
      })
    })
    const lat = pos.coords.latitude
    const lon = pos.coords.longitude
    const name = await reverseGeocode(lat, lon, signal)
    return { name, latitude: lat, longitude: lon, isFallback: false }
  } catch {
    warn('Geolocation failed, using fallback')
    return { ...DEFAULT_CITY, isFallback: true }
  }
}

async function fetchWeather(loc: LocResult, signal?: AbortSignal): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`天气服务不可用 (HTTP ${res.status})`)
  const data = await res.json()
  const cw = data.current_weather

  // Extract daily max and min temperature
  const tempMax =
    data.daily?.temperature_2m_max?.[0] !== undefined
      ? Math.round(data.daily.temperature_2m_max[0])
      : Math.round(cw.temperature)
  const tempMin =
    data.daily?.temperature_2m_min?.[0] !== undefined
      ? Math.round(data.daily.temperature_2m_min[0])
      : Math.round(cw.temperature)

  // Extract hourly forecasts
  const hourlyList: HourlyForecast[] = []
  if (data.hourly?.time && data.hourly?.temperature_2m && data.hourly?.weathercode) {
    let currentIndex = data.hourly.time.indexOf(cw.time)
    if (currentIndex === -1) {
      // Fallback: match by date hour prefix (e.g. "2026-05-22T16")
      const hourPrefix = cw.time.substring(0, 13)
      currentIndex = data.hourly.time.findIndex((t: string) => t.startsWith(hourPrefix))
    }
    if (currentIndex === -1) {
      currentIndex = 0
    }
    for (let i = 0; i < 6; i++) {
      const idx = currentIndex + i
      if (idx < data.hourly.time.length) {
        hourlyList.push({
          time: data.hourly.time[idx],
          temperature: Math.round(data.hourly.temperature_2m[idx]),
          weatherCode: data.hourly.weathercode[idx],
        })
      }
    }
  }

  return {
    location: loc.name,
    temperature: Math.round(cw.temperature),
    windspeed: cw.windspeed,
    weatherCode: cw.weathercode,
    isDay: cw.is_day === 1,
    isFallback: loc.isFallback,
    tempMax,
    tempMin,
    hourly: hourlyList,
  }
}

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()
    let cachedLoc: LocResult | null = null

    // Stale-while-revalidate: show cached value instantly, then refresh.
    const bootFromCache = async () => {
      const cached = await readCache<CacheEntry>(CACHE_KEY)
      if (cached && alive) {
        cachedLoc = cached.loc
        setData(cached.weather)
        // If the cached entry is fresh enough, skip the immediate refresh.
        if (Date.now() - cached.ts < FRESH_MS) return true
      }
      return false
    }

    const refresh = async () => {
      try {
        if (!cachedLoc || cachedLoc.isFallback) {
          const freshLoc = await getLocation(ctrl.signal)
          if (!freshLoc.isFallback || !cachedLoc) {
            cachedLoc = freshLoc
          }
        }
        const weather = await fetchWeather(cachedLoc, ctrl.signal)
        if (!alive) return
        setData(weather)
        setError(null)
        void writeCache(CACHE_KEY, { loc: cachedLoc, weather, ts: Date.now() })
      } catch (e) {
        if (!alive || (e instanceof DOMException && e.name === 'AbortError')) return
        setError(e instanceof Error ? e.message : '天气加载失败')
      }
    }

    ;(async () => {
      const fresh = await bootFromCache()
      if (!fresh) await refresh()
    })()

    const timer = setInterval(refresh, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      alive = false
      ctrl.abort()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return { data, error }
}
