import { useState, useMemo, memo } from 'react'
import { Minus } from 'lucide-react'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { getFaviconSources, getInitial, getColorFor } from './faviconFetcher'
import { cn } from '@/lib/cn'
import type { Shortcut } from '@/types/widget'

interface Props {
  shortcut: Shortcut
  editable: boolean
  /** Opens this shortcut's editor, which is what a click on the tile does while editing. */
  onEdit?: (id: string) => void
}

/** A Safari Favorites tile: the site icon on an app-icon plate, its name below. */
export const ShortcutTile = memo(function ShortcutTile({ shortcut, editable, onEdit }: Props) {
  const remove = useShortcutsStore((s) => s.remove)
  const [sourceIndex, setSourceIndex] = useState(0)

  const sources = useMemo(() => {
    const list: string[] = []
    if (shortcut.iconUrl) list.push(shortcut.iconUrl)
    list.push(...getFaviconSources(shortcut.url))
    return list
  }, [shortcut.iconUrl, shortcut.url])

  const hasIcon = sourceIndex < sources.length

  return (
    <div className="group flex w-full flex-col items-center gap-1.5">
      <div className="relative">
        {editable && (
          // While editing, a click opens the tile's editor, never the site.
          // Like the remove button, it sits above the widget's drag surface
          // (z-widget) so the click reaches it. It is laid over the plate
          // rather than taking its place, so the icon is not loaded again
          // each time editing starts or ends.
          <button
            type="button"
            onClick={() => onEdit?.(shortcut.id)}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label={`编辑${shortcut.title}`}
            title={`编辑${shortcut.title}`}
            className="peer absolute inset-0 z-widget rounded-tile"
          />
        )}
        {/* While editing, the link has no address: it is only the plate. */}
        <a
          href={editable ? undefined : shortcut.url}
          target={editable ? undefined : '_blank'}
          rel={editable ? undefined : 'noopener noreferrer'}
          title={editable ? undefined : shortcut.title}
          aria-label={editable ? undefined : shortcut.title}
          className={cn(
            'tile flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-tile transition-transform duration-fast',
            editable
              ? 'peer-hover:-translate-y-0.5 peer-active:translate-y-0 peer-active:scale-95'
              : 'active:translate-y-0 active:scale-95 group-hover:-translate-y-0.5',
          )}
          // No icon: a monogram on a colour picked from the name, as Safari does.
          style={hasIcon ? undefined : { backgroundColor: getColorFor(shortcut.title) }}
        >
          {hasIcon ? (
            <img
              src={sources[sourceIndex]}
              alt=""
              width={28}
              height={28}
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-[6px] object-contain"
              onError={() => setSourceIndex((i) => i + 1)}
            />
          ) : (
            <span aria-hidden className="text-[1.375rem] font-semibold leading-none text-white">
              {getInitial(shortcut.title)}
            </span>
          )}
        </a>
        {editable && (
          // Sits above the widget's drag surface (z-widget), so it stays
          // clickable while the layout is being edited.
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              remove(shortcut.id)
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label={`删除${shortcut.title}`}
            title={`删除${shortcut.title}`}
            className="material-pop animate-check-in absolute -left-1.5 -top-1.5 z-widget flex h-5 w-5 items-center justify-center rounded-full text-text-primary transition-transform duration-fast hover:scale-110 active:scale-95"
          >
            <Minus size={11} strokeWidth={3} aria-hidden />
          </button>
        )}
      </div>
      <span className="text-shadow-wallpaper w-full truncate text-center text-caption font-medium text-wp">
        {shortcut.title}
      </span>
    </div>
  )
})
