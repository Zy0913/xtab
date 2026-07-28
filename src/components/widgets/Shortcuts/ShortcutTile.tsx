import { useState, useMemo, memo } from 'react'
import { X } from 'lucide-react'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { getFaviconSources, getInitial, getColorFor } from './faviconFetcher'
import { cn } from '@/lib/cn'
import type { Shortcut } from '@/types/widget'

interface Props {
  shortcut: Shortcut
  editable: boolean
}

export const ShortcutTile = memo(function ShortcutTile({ shortcut, editable }: Props) {
  const remove = useShortcutsStore((s) => s.remove)
  const [sourceIndex, setSourceIndex] = useState(0)

  const sources = useMemo(() => {
    const list: string[] = []
    if (shortcut.iconUrl) list.push(shortcut.iconUrl)
    list.push(...getFaviconSources(shortcut.url))
    return list
  }, [shortcut.iconUrl, shortcut.url])

  const TileTag = editable ? 'div' : 'a'
  const linkProps = editable
    ? {}
    : { href: shortcut.url, target: '_blank', rel: 'noopener noreferrer' }

  return (
    <div className="group relative flex w-full flex-col items-center gap-1">
      <TileTag
        {...linkProps}
        className={cn(
          'bg-surface-strong/90 relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[14px] shadow-card transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-pop sm:h-[3.15rem] sm:w-[3.15rem]',
          editable && 'cursor-default',
        )}
        aria-label={shortcut.title}
      >
        {sourceIndex < sources.length ? (
          <img
            src={sources[sourceIndex]}
            alt=""
            width={26}
            height={26}
            className="h-6 w-6 object-contain sm:h-[1.625rem] sm:w-[1.625rem]"
            onError={() => setSourceIndex((i) => i + 1)}
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm"
            style={{ backgroundColor: getColorFor(shortcut.title) }}
          >
            {getInitial(shortcut.title)}
          </div>
        )}
      </TileTag>
      {editable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            remove(shortcut.id)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute -right-1 -top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow transition hover:scale-110"
          aria-label="删除"
        >
          <X size={12} />
        </button>
      )}
      <span
        className="text-shadow-wallpaper w-full max-w-[4.4rem] truncate text-center text-micro sm:text-[11px]"
        style={{ color: 'var(--text-primary)' }}
      >
        {shortcut.title}
      </span>
    </div>
  )
})
