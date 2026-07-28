import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  title: string
  trailing?: ReactNode
  className?: string
  /** When true, title announces updates (e.g. open todo count). */
  live?: boolean
}

/** Shared chrome for solid-glass widgets — keeps title rhythm consistent. */
export function WidgetHeader({ title, trailing, className, live = false }: Props) {
  return (
    <div
      className={cn('mb-2.5 flex min-h-[1.25rem] items-center justify-between gap-2', className)}
    >
      <span
        className="widget-title"
        aria-live={live ? 'polite' : undefined}
        aria-atomic={live || undefined}
      >
        {title}
      </span>
      {trailing}
    </div>
  )
}
