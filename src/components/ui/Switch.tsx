import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role'> {
  checked: boolean
  onChange: (checked: boolean) => void
}

/** macOS toggle switch. Styling lives in `.switch` (globals.css). */
export function Switch({ checked, onChange, className, ...props }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('switch', className)}
      {...props}
    />
  )
}
