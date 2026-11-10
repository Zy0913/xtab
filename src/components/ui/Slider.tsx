import type { CSSProperties, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface Props extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'min' | 'max'
> {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

/** macOS slider: native range input styled by `.range-slider`; the filled
 *  part of the track is driven by --range-fill. */
export function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  className,
  style,
  ...props
}: Props) {
  const fill = max > min ? (value - min) / (max - min) : 0
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn('range-slider', className)}
      style={{ ...style, '--range-fill': fill } as CSSProperties}
      {...props}
    />
  )
}
