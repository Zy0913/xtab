import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useSettingsStore, type SearchEngine } from '@/store/useSettingsStore'
import { ENGINES } from '@/lib/search'
import { cn } from '@/lib/cn'

export function EngineSelector() {
  const engine = useSettingsStore((s) => s.searchEngine)
  const setEngine = useSettingsStore((s) => s.setSearchEngine)
  const [open, setOpen] = useState(false)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    }
  }, [])

  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => setOpen(false), 120)
  }

  const current = ENGINES[engine]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={handleBlur}
        className="flex h-8 items-center gap-1 rounded-btn px-2 text-xs font-medium text-text-secondary hover:bg-surface-strong"
      >
        {current.name}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 min-w-[140px] overflow-hidden rounded-btn bg-surface-strong p-1 shadow-pop backdrop-blur-glass">
          {(Object.keys(ENGINES) as SearchEngine[]).map((id) => (
            <button
              key={id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setEngine(id)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between px-2.5 py-2 text-xs transition',
                id === engine
                  ? 'bg-accent/10 text-accent'
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
