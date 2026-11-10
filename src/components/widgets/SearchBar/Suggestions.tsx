import { Search } from 'lucide-react'

interface Props {
  items: string[]
  activeIndex: number
  onPick: (text: string, newTab: boolean) => void
  onHover: (index: number) => void
}

/**
 * Spotlight-style results under the search capsule. Options never take
 * focus: the field keeps it and points at the active one with
 * aria-activedescendant.
 */
export function Suggestions({ items, activeIndex, onPick, onHover }: Props) {
  return (
    <div
      id="search-suggestions"
      role="listbox"
      aria-label="搜索建议"
      onMouseLeave={() => onHover(-1)}
      className="material-pop animate-pop-in absolute inset-x-0 top-full z-dropdown mt-2 origin-top rounded-widget p-1.5"
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
