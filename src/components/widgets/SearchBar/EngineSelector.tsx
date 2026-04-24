import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { useSettingsStore, type SearchEngine } from '@/store/useSettingsStore'
import { ENGINES } from '@/lib/search'
import { cn } from '@/lib/cn'

const ENGINE_IDS = Object.keys(ENGINES) as SearchEngine[]

export function EngineSelector() {
  const engine = useSettingsStore((s) => s.searchEngine)
  const setEngine = useSettingsStore((s) => s.setSearchEngine)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    }
  }, [])

  const handleBlur = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    blurTimerRef.current = setTimeout(() => {
      setOpen(false)
      setActiveIndex(-1)
    }, 120)
  }

  const selectEngine = useCallback((id: SearchEngine) => {
    setEngine(id)
    setOpen(false)
    setActiveIndex(-1)
  }, [setEngine])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
        setActiveIndex(ENGINE_IDS.indexOf(engine))
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % ENGINE_IDS.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + ENGINE_IDS.length) % ENGINE_IDS.length)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0) selectEngine(ENGINE_IDS[activeIndex])
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  const current = ENGINES[engine]

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => {
          setOpen((v) => !v)
          if (!open) setActiveIndex(ENGINE_IDS.indexOf(engine))
        }}
        onBlur={handleBlur}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="选择搜索引擎"
        className="flex h-8 items-center gap-1 rounded-btn px-2 text-xs font-medium text-text-secondary hover:bg-surface-strong"
      >
        {current.name}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="搜索引擎"
          className="absolute left-0 top-full z-20 mt-2 min-w-[140px] overflow-hidden rounded-btn bg-surface-strong p-1 shadow-pop backdrop-blur-glass"
        >
          {ENGINE_IDS.map((id, index) => (
            <button
              key={id}
              role="option"
              aria-selected={id === engine}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectEngine(id)}
              className={cn(
                'flex w-full items-center justify-between px-2.5 py-2 text-xs transition',
                id === engine
                  ? 'bg-accent/10 text-accent'
                  : index === activeIndex
                    ? 'bg-surface text-text-primary'
                    : 'text-text-primary hover:bg-surface',
              )}
            >
              {ENGINES[id].name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
