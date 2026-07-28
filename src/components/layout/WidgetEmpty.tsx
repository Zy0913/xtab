import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  description?: string
}

/** Unified empty / error placeholder inside solid widgets. */
export function WidgetEmpty({ icon, title, description }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-5 text-center">
      <div className="bg-surface-strong/40 mb-2.5 flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary">
        {icon}
      </div>
      <p className="text-caption font-medium text-text-secondary">{title}</p>
      {description && (
        <p className="mt-0.5 max-w-[14rem] text-micro text-text-tertiary">{description}</p>
      )}
    </div>
  )
}
