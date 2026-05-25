import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/lib/useFocusTrap'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const trapRef = useFocusTrap(open)
  const [shouldRender, setShouldRender] = useState(open)
  const [animateIn, setAnimateIn] = useState(open)

  // Sync state with open prop during rendering to avoid synchronous useEffect updates
  if (open && !shouldRender) {
    setShouldRender(true)
  }
  if (!open && animateIn) {
    setAnimateIn(false)
  }

  useEffect(() => {
    if (open) {
      // Allow a brief frame delay to trigger transition after mounting
      const timer = requestAnimationFrame(() => {
        setAnimateIn(true)
      })
      return () => cancelAnimationFrame(timer)
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!shouldRender) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md transition-all duration-200 ease-out',
        animateIn ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none',
      )}
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full max-w-md rounded-card border border-border bg-surface-strong p-5 shadow-pop backdrop-blur-glass transition-all duration-200 ease-out',
          animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-3 top-3 rounded-full p-1 text-text-secondary hover:bg-surface hover:text-text-primary transition"
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
