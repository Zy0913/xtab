import { useEffect, useRef, useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { ENGINES, fetchSuggestions } from '@/lib/search'
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    if (newTab) window.open(url, '_blank', 'noopener')
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
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2.5 border border-border bg-surface px-5 shadow-card backdrop-blur-glass transition-all focus-within:ring-2 focus-within:ring-accent/30 hover:shadow-pop"
        style={{ borderRadius: 'var(--radius-pill)' }}>
        <EngineSelector />
        <div className="h-5 w-px bg-border" />
        <SearchIcon size={16} className="text-text-tertiary" />
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
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
        />
        <kbd className="hidden rounded bg-surface-strong px-1.5 py-0.5 text-[10px] text-text-tertiary sm:inline">
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
