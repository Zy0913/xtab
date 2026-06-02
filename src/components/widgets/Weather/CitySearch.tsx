import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
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

  // Derive displayed results based on query
  const results = useMemo(() => {
    if (!query.trim()) return []
    return rawResults
  }, [query, rawResults])

  // Close on click outside
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

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Debounced search
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
        <div className="bg-surface-strong/80 flex items-center gap-1.5 rounded-md border border-border px-2 py-1 backdrop-blur-sm">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索城市…"
            className="w-20 bg-transparent text-[12px] text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <button
            onClick={() => {
              setOpen(false)
              setQuery('')
              setRawResults([])
            }}
            className="text-text-tertiary transition-colors hover:text-text-secondary"
          >
            <X size={12} />
          </button>
        </div>

        {(loading || results.length > 0) && (
          <div className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-surface-strong shadow-card">
            {loading && <div className="px-3 py-2 text-[11px] text-text-tertiary">搜索中…</div>}

            {!loading && results.length > 0 && (
              <div className="max-h-40 overflow-y-auto">
                {results.map((city) => (
                  <button
                    key={`${city.latitude},${city.longitude}`}
                    onClick={() => handleSelect(city)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="truncate text-[12px] text-text-primary">{city.name}</span>
                    <span className="ml-2 shrink-0 text-[11px] text-text-tertiary">
                      {city.country}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-text-tertiary">无结果</div>
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
      className="flex items-center gap-0.5 rounded px-1 py-0.5 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
    >
      <span className="text-[13px] font-semibold">{currentCity}</span>
      <ChevronDown size={14} />
    </button>
  )
}
