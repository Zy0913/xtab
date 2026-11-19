import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  items: string[]
  activeIndex: number
  placement?: 'top' | 'bottom'
  onPick: (text: string, newTab: boolean) => void
  onHover: (index: number) => void
}

/**
 * Spotlight-style results under the search capsule. Options never take
 * focus: the field keeps it and points at the active one with
 * aria-activedescendant.
 */
export function Suggestions({ items, activeIndex, placement = 'bottom', onPick, onHover }: Props) {
  return (
    <div
      id="search-suggestions"
      role="listbox"
      aria-label="搜索建议"
      onMouseLeave={() => onHover(-1)}
      className={cn(
        'material-pop animate-pop-in absolute inset-x-0 z-dropdown max-h-[min(22rem,45vh)] overflow-y-auto rounded-widget p-1.5',
        placement === 'top' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top',
      )}
    >
      {items.map((text, i) => (
        <div
          key={`${i}-${text}`}
          id={`suggestion-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          data-active={i === activeIndex}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => onPick(text, e.metaKey || e.ctrlKey)}
          onMouseEnter={() => onHover(i)}
          className="menu-item min-h-9 gap-3 rounded-[calc(var(--radius-widget)-6px)] px-3 text-callout"
        >
          <Search size={15} strokeWidth={2} className="menu-item-meta shrink-0" aria-hidden />
          <span className="truncate">{text}</span>
        </div>
      ))}
    </div>
  )
}
