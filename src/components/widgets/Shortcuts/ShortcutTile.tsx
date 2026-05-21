import { useState, useMemo, useEffect, memo } from 'react'
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

  useEffect(() => {
    setSourceIndex(0)
  }, [sources])

  const TileTag = editable ? 'div' : 'a'
  const linkProps = editable
    ? {}
    : { href: shortcut.url, target: '_blank', rel: 'noopener noreferrer' }

  return (
    <div className="group relative flex flex-col items-center gap-2">
      <TileTag
        {...linkProps}
        className={cn(
          'relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-card bg-surface-strong shadow-card transition group-hover:-translate-y-0.5',
          editable && 'cursor-default',
        )}
        aria-label={shortcut.title}
      >
        {sourceIndex < sources.length ? (
          <img
            src={sources[sourceIndex]}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            onError={() => setSourceIndex((i) => i + 1)}
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white"
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
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition hover:scale-110 z-20"
          aria-label="删除"
        >
          <X size={12} />
        </button>
      )}
      <span
        className="max-w-[72px] truncate text-xs text-shadow-wallpaper"
        style={{ color: 'var(--text-on-dark)' }}>
        {shortcut.title}
      </span>
    </div>
  )
})
