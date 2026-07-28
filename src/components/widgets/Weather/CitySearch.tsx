import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { searchCities, type CitySearchResult } from './useWeather'
import { useWeatherCityStore } from '@/store/useWeatherCityStore'

interface Props {
  currentCity: string
}

export function CitySearch({ currentCity }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [rawResults, setRawResults] = useState<CitySearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const setSelectedCity = useWeatherCityStore((s) => s.setSelectedCity)

  const results = useMemo(() => {
    if (!query.trim()) return []
    return rawResults
  }, [query, rawResults])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
        setRawResults([])
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!query.trim()) return

    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      const r = await searchCities(query, ctrl.signal)
      if (!ctrl.signal.aborted) {
        setRawResults(r)
        setLoading(false)
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query])

  const handleSelect = (city: CitySearchResult) => {
    setSelectedCity({
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
    })
    setOpen(false)
    setQuery('')
    setRawResults([])
  }

  if (open) {
    return (
      <div ref={containerRef} className="relative">
        <div className="bg-surface-strong/90 flex items-center gap-1.5 rounded-btn border border-border px-2.5 py-1 backdrop-blur-sm">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索城市…"
            className="w-24 bg-transparent text-caption text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <button
            onClick={() => {
              setOpen(false)
              setQuery('')
              setRawResults([])
            }}
            className="text-text-tertiary transition-colors hover:text-text-secondary"
            aria-label="取消"
          >
            <X size={12} />
          </button>
        </div>

        {(loading || results.length > 0 || query.trim()) && (
          <div className="backdrop-blur-glass absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-btn border border-border bg-surface-strong p-1 shadow-pop">
            {loading && <div className="px-2.5 py-2 text-micro text-text-tertiary">搜索中…</div>}

            {!loading && results.length > 0 && (
              <div className="max-h-40 overflow-y-auto">
                {results.map((city) => (
                  <button
                    key={`${city.latitude},${city.longitude}`}
                    onClick={() => handleSelect(city)}
                    className="flex w-full items-center justify-between rounded-btn px-2.5 py-2 text-left transition-colors hover:bg-surface"
                  >
                    <span className="truncate text-caption text-text-primary">{city.name}</span>
                    <span className="ml-2 shrink-0 text-micro text-text-tertiary">
                      {city.country}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="px-2.5 py-2 text-micro text-text-tertiary">无结果</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        setOpen(true)
        setQuery('')
        setRawResults([])
      }}
      className="text-text-primary/80 group -ml-0.5 flex max-w-full items-center gap-0.5 rounded-md px-0.5 py-0.5 text-left transition-colors hover:text-text-primary"
    >
      <span className="truncate text-[12.5px] font-medium leading-snug tracking-wide">
        {currentCity}
      </span>
      <MapPin
        size={11}
        strokeWidth={2.4}
        className="mb-px shrink-0 opacity-50 transition group-hover:opacity-75"
        aria-hidden
      />
    </button>
  )
}
