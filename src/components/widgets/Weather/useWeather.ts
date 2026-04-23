import { useEffect, useState } from 'react'

interface GeocodeResult {
  name: string
  latitude: number
  longitude: number
  country?: string
}

interface WeatherData {
  location: string
  temperature: number
  windspeed: number
  weatherCode: number
  isDay: boolean
  isFallback: boolean
}

interface LocResult extends GeocodeResult {
  isFallback: boolean
}

async function getLocation(): Promise<LocResult> {
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 4000,
        maximumAge: 1000 * 60 * 60,
      })
    })

    const lat = pos.coords.latitude
    const lon = pos.coords.longitude
    let name = '当前位置'

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=zh-CN`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.address) {
          const { city, town, county, state } = data.address
          name = city || town || county || state || '当前位置'
        }
      }
    } catch {
      // keep '当前位置' as name if reverse geocoding fails
    }

    return { name, latitude: lat, longitude: lon, isFallback: false }
  } catch {
    return { name: '北京', latitude: 39.9042, longitude: 116.4074, isFallback: true }
  }
}

async function fetchWeather(loc: LocResult): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`天气服务不可用 (HTTP ${res.status})`)
  const data = await res.json()
  const cw = data.current_weather
  return {
    location: loc.name,
    temperature: Math.round(cw.temperature),
    windspeed: cw.windspeed,
    weatherCode: cw.weathercode,
    isDay: cw.is_day === 1,
    isFallback: loc.isFallback,
  }
}

const REFRESH_MS = 15 * 60 * 1000

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    let cachedLoc: LocResult | null = null

    const load = async () => {
      try {
        if (!cachedLoc) cachedLoc = await getLocation()
        const w = await fetchWeather(cachedLoc)
        if (alive) {
          setData(w)
          setError(null)
        }
      } catch (e) {
        if (alive) setError((e as Error).message)
      }
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      alive = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return { data, error }
}
