import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'focus:border-accent/40 focus:bg-surface-strong/60 focus:ring-accent/20 h-9 w-full rounded-btn border border-border bg-surface px-3 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:ring-2',
        className,
      )}
      {...props}
    />
  )
})
