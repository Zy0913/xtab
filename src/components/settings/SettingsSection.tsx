import { useId, type ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

/** A titled block of the settings panel, like a System Settings group header. */
export function SettingsSection({ title, children }: Props) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-2.5">
      <h3 id={id} className="px-1 text-body font-semibold text-text-primary">
        {title}
      </h3>
      {children}
    </section>
  )
}

interface RowLabelProps {
  label: ReactNode
  description?: ReactNode
  id?: string
}

/** Leading label of a form row, with an optional secondary line. */
export function RowLabel({ label, description, id }: RowLabelProps) {
  return (
    <span className="min-w-0 flex-1">
      <span id={id} className="block">
        {label}
      </span>
      {description && (
        <span className="mt-0.5 block text-caption text-text-secondary">{description}</span>
      )}
    </span>
  )
}
