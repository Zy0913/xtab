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
    // While pinyin is being composed, Enter and the arrows drive the input
    // method's candidate list; submitting then would search half a word.
    if (e.nativeEvent.isComposing) return
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

  const expanded = focused && suggestions.length > 0

  return (
    <div className="flex flex-1 items-center">
      <div className="relative mx-auto w-full max-w-2xl">
        {/* A Spotlight capsule. The ring follows the field's own focus, not
            the engine button's. */}
        <div className="relative h-[3.25rem] rounded-full has-[input:focus-visible]:outline has-[input:focus-visible]:outline-[3px] has-[input:focus-visible]:outline-[color:var(--focus-color)]">
          <div
            aria-hidden
            className="material pointer-events-none absolute inset-0 rounded-[inherit]"
          />
          <div className="relative flex h-full items-center gap-2.5 pl-[1.125rem] pr-2.5">
            <SearchIcon
              size={18}
              strokeWidth={2}
              className="shrink-0 text-text-secondary"
              aria-hidden
            />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={expanded}
              aria-controls={expanded ? 'search-suggestions' : undefined}
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
              className="h-full min-w-0 flex-1 bg-transparent text-title text-text-primary outline-none"
            />
            <kbd
              aria-hidden
              title="按 / 聚焦搜索"
              className={cn(
                'keycap hidden transition-opacity duration-fast sm:inline-flex',
                (focused || query) && 'opacity-0',
              )}
            >
              /
            </kbd>
            <EngineSelector />
          </div>
        </div>
        {expanded && (
          <Suggestions
            items={suggestions}
            activeIndex={activeIndex}
            onPick={(text, newTab) => submit(text, newTab)}
            onHover={setActiveIndex}
          />
        )}
      </div>
    </div>
  )
}
