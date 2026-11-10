import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useRovingRadio } from '@/lib/useRovingRadio'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

interface Props<T extends string> {
  value: T
  options: ReadonlyArray<SegmentOption<T>>
  onChange: (value: T) => void
  'aria-label': string
  disabled?: boolean
  className?: string
}

/** macOS segmented control with radio-group keyboard behaviour (arrow keys
 *  move the selection, only the selected segment is in the tab order). */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: Props<T>) {
  const { register, onKeyDown } = useRovingRadio(options.length, (i) => onChange(options[i].value))

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={cn('segmented', className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={register(index)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {option.icon}
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
