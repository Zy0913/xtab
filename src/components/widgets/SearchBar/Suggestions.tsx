import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  items: string[]
  activeIndex: number
  onPick: (text: string, newTab: boolean) => void
  onHover: (index: number) => void
}

export function Suggestions({ items, activeIndex, onPick, onHover }: Props) {
  return (
    <div
      id="search-suggestions"
      role="listbox"
      aria-label="搜索建议"
      className="backdrop-blur-glass glass-noise absolute left-1/2 top-full z-10 mt-2 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-card border border-border bg-surface-strong p-1.5 shadow-pop sm:max-w-2xl"
    >
      {items.map((text, i) => (
        <button
          key={`${i}-${text}`}
          id={`suggestion-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => onPick(text, e.metaKey || e.ctrlKey)}
          onMouseEnter={() => onHover(i)}
          className={cn(
            'relative z-[2] flex w-full items-center gap-2.5 rounded-btn px-3 py-2.5 text-left text-sm transition',
            i === activeIndex
              ? 'bg-accent/18 text-text-primary'
              : 'text-text-primary hover:bg-surface',
          )}
        >
          <Search size={14} className="shrink-0 text-text-tertiary" strokeWidth={1.75} />
          <span className="truncate">{text}</span>
        </button>
      ))}
    </div>
  )
}
