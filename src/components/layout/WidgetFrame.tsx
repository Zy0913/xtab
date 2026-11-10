import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  children: ReactNode
  editMode: boolean
  className?: string
  /** Wallpaper widgets (clock, search, shortcuts) have no material of their own. */
  transparent?: boolean
}

export function WidgetFrame({ children, editMode, className, transparent = false }: Props) {
  return (
    <div
      className={cn(
        'relative h-full w-full rounded-widget transition-[background-color,box-shadow] duration-slow',
        // A faint plate shows a wallpaper widget's bounds while editing.
        transparent && editMode && 'bg-wp/[0.08] ring-1 ring-inset ring-wp/20',
        className,
      )}
      style={{ containerType: 'inline-size' }}
    >
      {!transparent && (
        // The material sits on its own layer: a backdrop-filter on the
        // content's container would stop popovers inside it from blurring
        // the wallpaper.
        <div
          aria-hidden
          className="widget-material material pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      )}
      {children}
    </div>
  )
}
