import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  description?: string
}

/** Unified empty / error placeholder inside solid widgets. */
export function WidgetEmpty({ icon, title, description }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
      <div
        aria-hidden
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-fill text-text-secondary"
      >
        {icon}
      </div>
      <p className="text-body font-medium text-text-secondary">{title}</p>
      {description && (
        <p className="mt-0.5 max-w-[16rem] text-caption text-text-secondary">{description}</p>
      )}
    </div>
  )
}
