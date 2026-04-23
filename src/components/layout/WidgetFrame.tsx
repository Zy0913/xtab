import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  children: ReactNode
  editMode: boolean
  className?: string
  transparent?: boolean
}

export function WidgetFrame({
  children,
  editMode,
  className,
  transparent = false,
}: Props) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-visible rounded-card',
        transparent
          ? 'bg-transparent'
          : 'bg-surface shadow-card backdrop-blur-glass glass-noise',
        editMode && 'ring-[1.5px] ring-accent/20 ring-offset-[1px] ring-offset-transparent',
        className,
      )}
    >
      {children}
    </div>
  )
}