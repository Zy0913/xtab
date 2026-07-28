import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  children: ReactNode
  editMode: boolean
  className?: string
  transparent?: boolean
}

export function WidgetFrame({ children, editMode, className, transparent = false }: Props) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-visible rounded-card transition-[box-shadow,ring-color] duration-200',
        transparent ? 'bg-transparent' : 'backdrop-blur-glass glass-noise bg-surface shadow-card',
        editMode && 'ring-accent/30 shadow-pop ring-[1.5px] ring-offset-1 ring-offset-transparent',
        className,
      )}
      style={{ containerType: 'inline-size' }}
    >
      {children}
    </div>
  )
}
