import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

/* macOS push buttons: the default (primary) button is accent-filled, the
   regular one is a raised neutral button. Rounded rects in the classic
   material, capsules in Liquid Glass (via --radius-control). */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent shadow-[inset_0_0.5px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(0_0_0/0.16)] hover:bg-accent-hover',
  secondary: 'bg-btn text-text-primary shadow-btn hover:bg-btn-hover',
  ghost: 'bg-transparent text-text-secondary hover:bg-fill hover:text-text-primary',
  danger:
    'bg-danger text-white shadow-[inset_0_0.5px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(0_0_0/0.16)] hover:brightness-110',
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-3 text-caption',
  md: 'h-8 px-4 text-body',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-control font-medium transition-[background-color,color,filter,transform] duration-fast active:brightness-95 disabled:pointer-events-none disabled:opacity-40 glass:active:scale-[0.97]',
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
