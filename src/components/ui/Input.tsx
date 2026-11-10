import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement>

/** NSTextField: a recessed field with a hairline edge; focus draws the global
 *  accent focus ring. */
export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-8 w-full rounded-field bg-control px-3 text-body text-text-primary shadow-[inset_0_0_0_0.5px_var(--control-border)] transition-shadow disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
