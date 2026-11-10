import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  src: string
  label: string
  title?: string
  selected: boolean
  onSelect: () => void
  /** Overlay controls, e.g. a remove badge. */
  children?: ReactNode
}

/** Wallpaper thumbnail; the current one gets the accent ring, as in System Settings › Wallpaper. */
export function WallpaperThumb({ src, label, title, selected, onSelect, children }: Props) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        aria-label={label}
        aria-current={selected || undefined}
        title={title ?? label}
        className={cn(
          'block aspect-video w-full overflow-hidden rounded-[8px] bg-fill outline outline-2 outline-offset-2 transition-[outline-color] duration-fast focus-visible:outline-[3px]',
          selected
            ? 'outline-accent'
            : 'outline-transparent hover:outline-[color:var(--fill-strong)] focus-visible:outline-[color:var(--focus-color)]',
        )}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
        />
      </button>
      {children}
    </div>
  )
}
