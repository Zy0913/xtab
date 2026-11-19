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
          'block aspect-video w-full overflow-hidden rounded-[8px] bg-fill transition-shadow duration-fast focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[color:var(--focus-color)]',
          selected
            ? 'shadow-[0_0_0_2px_rgb(var(--mat-rgb)),0_0_0_4px_var(--accent)]'
            : 'hover:shadow-[0_0_0_2px_rgb(var(--mat-rgb)),0_0_0_3.5px_var(--fill-strong)]',
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
