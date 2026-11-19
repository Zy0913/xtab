import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useSettingsStore, type SearchEngine } from '@/store/useSettingsStore'
import { ENGINES } from '@/lib/search'
import { cn } from '@/lib/cn'
import { shouldOpenUpward } from './dropdownPlacement'

const ENGINE_IDS = Object.keys(ENGINES) as SearchEngine[]

/** Pop-up button at the end of the search capsule; the menu checks the current engine. */
export function EngineSelector() {
  const engine = useSettingsStore((s) => s.searchEngine)
  const setEngine = useSettingsStore((s) => s.setSearchEngine)
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const selectEngine = useCallback(
    (id: SearchEngine) => {
      setEngine(id)
      setOpen(false)
      setActiveIndex(-1)
    },
    [setEngine],
  )

  const openMenu = useCallback(() => {
    setDropUp(shouldOpenUpward(wrapRef.current, 180))
    setOpen(true)
    setActiveIndex(ENGINE_IDS.indexOf(engine))
  }, [engine])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openMenu()
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
    <div ref={wrapRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => {
          if (open) setOpen(false)
          else openMenu()
        }}
        onBlur={handleBlur}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`搜索引擎：${current.name}`}
        title="选择搜索引擎"
        className="flex h-8 items-center gap-1 rounded-full pl-3 pr-2 text-body font-medium text-text-secondary transition-colors duration-fast hover:bg-fill hover:text-text-primary aria-expanded:bg-fill aria-expanded:text-text-primary"
      >
        {current.name}
        <ChevronsUpDown size={12} strokeWidth={2.25} className="opacity-70" aria-hidden />
      </button>
      {open && (
        // Drops 8px outside the capsule: the button sits 10px inside its edge.
        <div
          role="listbox"
          aria-label="搜索引擎"
          onMouseLeave={() => setActiveIndex(-1)}
          className={cn(
            'material-pop animate-pop-in absolute right-0 z-dropdown min-w-40 rounded-menu p-1.5',
            dropUp
              ? 'bottom-full mb-[1.125rem] origin-bottom-right'
              : 'top-full mt-[1.125rem] origin-top-right',
          )}
        >
          {ENGINE_IDS.map((id, index) => (
            <div
              key={id}
              role="option"
              aria-selected={id === engine}
              data-active={index === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectEngine(id)}
              className="menu-item"
            >
              <Check
                size={13}
                strokeWidth={2.5}
                className={cn('shrink-0', id !== engine && 'invisible')}
                aria-hidden
              />
              {ENGINES[id].name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
