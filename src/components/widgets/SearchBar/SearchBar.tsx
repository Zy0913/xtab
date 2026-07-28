import { useEffect, useRef, useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { ENGINES, fetchSuggestions } from '@/lib/search'
import { useShortcut } from '@/lib/useShortcut'
import { cn } from '@/lib/cn'
import { EngineSelector } from './EngineSelector'
import { Suggestions } from './Suggestions'

export function SearchBar() {
  const engine = useSettingsStore((s) => s.searchEngine)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useShortcut('/', () => inputRef.current?.focus())

  useEffect(() => {
    if (!query.trim()) return
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      const items = await fetchSuggestions(engine, query, ctrl.signal)
      setSuggestions(items)
      setActiveIndex(-1)
    }, 150)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query, engine])

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current)
      }
    }
  }, [])

  const submit = (text: string, newTab = false) => {
    const q = text.trim()
    if (!q) return
    const url = ENGINES[engine].searchUrl(q)
    if (newTab) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.href = url
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      const picked = activeIndex >= 0 ? suggestions[activeIndex] : query
      submit(picked, e.metaKey || e.ctrlKey)
    } else if (e.key === 'Escape') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const handleBlur = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    blurTimerRef.current = setTimeout(() => setFocused(false), 120)
  }

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'backdrop-blur-glass glass-noise focus-within:border-accent/25 focus-within:ring-accent/25 relative mx-auto flex h-12 max-w-xl items-center gap-2 border border-border bg-surface px-4 shadow-card transition-all duration-200 focus-within:shadow-pop focus-within:ring-2 hover:shadow-pop sm:h-[3.25rem] sm:max-w-2xl sm:gap-2.5 sm:px-5',
          focused && 'bg-surface-strong/80',
        )}
        style={{ borderRadius: 'var(--radius-pill)' }}
      >
        <EngineSelector />
        <div className="h-4 w-px shrink-0 bg-border" aria-hidden />
        <SearchIcon size={16} className="shrink-0 text-text-tertiary" strokeWidth={1.75} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={focused && suggestions.length > 0}
          aria-controls={focused && suggestions.length > 0 ? 'search-suggestions' : undefined}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label="搜索"
          value={query}
          onChange={(e) => {
            const next = e.target.value
            setQuery(next)
            if (!next.trim()) {
              setSuggestions([])
              setActiveIndex(-1)
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={ENGINES[engine].placeholder}
          className="relative z-[2] flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary sm:text-[15px]"
        />
        <kbd
          className={cn(
            'bg-surface-strong/90 relative z-[2] hidden rounded-md px-1.5 py-0.5 text-micro text-text-tertiary transition sm:inline',
            focused && 'opacity-40',
          )}
        >
          /
        </kbd>
      </div>
      {focused && suggestions.length > 0 && (
        <Suggestions
          items={suggestions}
          activeIndex={activeIndex}
          onPick={(text, newTab) => submit(text, newTab)}
          onHover={setActiveIndex}
        />
      )}
    </div>
  )
}
