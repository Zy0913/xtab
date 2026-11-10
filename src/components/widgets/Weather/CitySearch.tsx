import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { searchCities, type CitySearchResult } from './useWeather'
import { useWeatherCityStore } from '@/store/useWeatherCityStore'

interface Props {
  currentCity: string
}

/**
 * The city name doubles as a pop-up button. Clicking it swaps in a search
 * field of the same height, so the temperature below never moves.
 */
export function CitySearch({ currentCity }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // Results remember the query they answer, so "no results" never flashes
  // while the next request is still debouncing.
  const [found, setFound] = useState<{ query: string; cities: CitySearchResult[] }>({
    query: '',
    cities: [],
  })
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)
  const listId = useId()
  const setSelectedCity = useWeatherCityStore((s) => s.setSelectedCity)

  const trimmed = query.trim()
  const cities = trimmed ? found.cities : []
  const settled = found.query === trimmed

  const close = useCallback((refocus: boolean) => {
    restoreFocus.current = refocus
    setOpen(false)
    setQuery('')
    setFound({ query: '', cities: [] })
    setActiveIndex(-1)
  }, [])

  // Focus the field on open; hand focus back to the city name after a
  // keyboard close so the user isn't dropped at the top of the page.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    } else if (restoreFocus.current) {
      restoreFocus.current = false
      triggerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, close])

  useEffect(() => {
    if (!trimmed) return
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      const cities = await searchCities(trimmed, ctrl.signal)
      if (ctrl.signal.aborted) return
      setFound({ query: trimmed, cities })
      setActiveIndex(-1)
    }, 300)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [trimmed])

  const select = (city: CitySearchResult, refocus: boolean) => {
    setSelectedCity({ name: city.name, latitude: city.latitude, longitude: city.longitude })
    close(refocus)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter and Escape belong to the input method while it is composing.
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (cities.length === 0) return
      e.preventDefault()
      const down = e.key === 'ArrowDown'
      setActiveIndex((i) => {
        if (down) return i + 1 >= cities.length ? 0 : i + 1
        return i <= 0 ? cities.length - 1 : i - 1
      })
    } else if (e.key === 'Enter') {
      // A highlighted row is a deliberate pick; otherwise take the top hit,
      // but only once the results answer what is in the field.
      const city = activeIndex >= 0 ? cities[activeIndex] : settled ? cities[0] : undefined
      if (!city) return
      e.preventDefault()
      select(city, true)
    }
  }

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${currentCity}，更换城市`}
        title="更换城市"
        className="-ml-1.5 flex h-7 max-w-full items-center gap-1 rounded-row px-1.5 text-callout font-semibold text-text-primary transition-colors duration-fast hover:bg-fill active:bg-fill-strong"
      >
        <span className="truncate">{currentCity}</span>
        <ChevronDown
          size={13}
          strokeWidth={2.5}
          className="shrink-0 text-text-secondary"
          aria-hidden
        />
      </button>
    )
  }

  const expanded = cities.length > 0

  return (
    <div
      ref={containerRef}
      className="relative -ml-1.5"
      // Tabbing away closes the search like clicking elsewhere does.
      onBlur={(e) => {
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) close(false)
      }}
    >
      <div className="flex h-7 w-44 max-w-full items-center gap-1.5 rounded-field bg-fill pl-2 pr-1 has-[input:focus-visible]:outline has-[input:focus-visible]:outline-[3px] has-[input:focus-visible]:outline-[color:var(--focus-color)]">
        <Search size={13} strokeWidth={2.25} className="shrink-0 text-text-secondary" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={
            expanded && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-label="搜索城市"
          placeholder="搜索城市"
          autoComplete="off"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none"
        />
        <button
          type="button"
          // detail is 0 for a keyboard press: only then return focus.
          onClick={(e) => close(e.detail === 0)}
          aria-label="取消"
          title="取消"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors duration-fast hover:bg-fill-strong hover:text-text-primary"
        >
          <X size={12} strokeWidth={2.5} aria-hidden />
        </button>
      </div>

      {trimmed && (
        <div className="material-pop animate-pop-in absolute left-0 top-full z-dropdown mt-1.5 w-60 origin-top-left rounded-menu p-1.5">
          {expanded ? (
            <div
              id={listId}
              role="listbox"
              aria-label="城市"
              onMouseLeave={() => setActiveIndex(-1)}
              className="max-h-60 overflow-y-auto"
            >
              {cities.map((city, i) => (
                <div
                  key={`${city.latitude},${city.longitude}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  data-active={i === activeIndex}
                  // Keep focus in the field so the list stays open.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => select(city, false)}
                  className="menu-item"
                >
                  <span className="truncate">{city.name}</span>
                  {(city.country || city.region) && (
                    // "中国 浙江" vs "中国 四川": two 杭州 are not the same city.
                    <span className="menu-item-meta ml-auto max-w-[60%] shrink-0 truncate pl-3 text-caption">
                      {[city.country, city.region].filter(Boolean).join(' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p role="status" className="px-2 py-1 text-body text-text-secondary">
              {settled ? '没有找到这个城市' : '正在搜索…'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
