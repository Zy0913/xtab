import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useRovingRadio } from '@/lib/useRovingRadio'

export interface Choice<T extends string> {
  value: T
  label: string
  preview: ReactNode
}

interface Props<T extends string> {
  value: T
  options: ReadonlyArray<Choice<T>>
  onChange: (value: T) => void
  'aria-labelledby'?: string
  'aria-label'?: string
  /** Sizing for the preview box, e.g. an aspect ratio. */
  previewClassName?: string
  className?: string
}

/**
 * Thumbnail picker from System Settings › Appearance: a picture per option
 * with the label underneath, and an accent ring around the selected picture.
 */
export function ChoiceTiles<T extends string>({
  value,
  options,
  onChange,
  previewClassName,
  className,
  ...aria
}: Props<T>) {
  const { register, onKeyDown } = useRovingRadio(options.length, (i) => onChange(options[i].value))

  return (
    <div
      role="radiogroup"
      {...aria}
      className={cn('grid auto-cols-fr grid-flow-col gap-3', className)}
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
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className="group flex min-w-0 flex-col items-center gap-1.5 focus-visible:outline-none"
          >
            <span
              aria-hidden
              className={cn(
                'relative block w-full overflow-hidden rounded-[9px] outline outline-2 outline-offset-2 transition-[outline-color] duration-fast group-focus-visible:outline-[3px]',
                selected
                  ? 'outline-accent'
                  : 'outline-transparent group-hover:outline-[color:var(--fill-strong)] group-focus-visible:outline-[color:var(--focus-color)]',
                previewClassName,
              )}
            >
              {option.preview}
            </span>
            <span
              className={cn(
                'max-w-full truncate text-caption',
                selected ? 'font-medium text-text-primary' : 'text-text-secondary',
              )}
            >
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
