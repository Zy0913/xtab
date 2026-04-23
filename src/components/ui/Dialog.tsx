import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md transition-all"
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full max-w-md rounded-card border border-border bg-surface-strong p-5 shadow-pop backdrop-blur-glass',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-3 top-3 rounded-full p-1 text-text-tertiary hover:bg-surface hover:text-text-primary transition"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={16} />
        </button>
        {title && (
          <h2 className="mb-4 text-base font-semibold text-text-primary">{title}</h2>
        )}
        {children}
      </div>
    </div>,
    document.getElementById('portal-root') || document.body
  )
}
