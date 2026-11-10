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
  /** The key that opens the dialog. It keeps working while the dialog is
   *  open, so it closes it again; other page shortcuts wait (useShortcut). */
  shortcut?: string
}

export function Dialog({ open, onClose, title, children, className, shortcut }: DialogProps) {
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

  // The scrim is a sibling of the panel, not its parent: a fading ancestor
  // (opacity < 1) would cut the panel's backdrop blur off from the page.
  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4" onClick={onClose}>
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 transition-opacity',
          animateIn ? 'opacity-100' : 'opacity-0',
        )}
        style={{ backgroundColor: 'var(--scrim)' }}
      />
      <div
        ref={trapRef}
        role="dialog"
        // Modal only while open: fading out, it no longer holds the keyboard.
        aria-modal={open ? 'true' : undefined}
        aria-keyshortcuts={shortcut}
        aria-label={title}
        className={cn(
          'material-pop w-full max-w-md rounded-panel p-5 outline-none transition-[opacity,transform]',
          animateIn ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-fill text-text-secondary transition-colors hover:bg-fill-strong hover:text-text-primary"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={13} strokeWidth={2.25} />
        </button>
        {title && (
          <h2 className="mb-4 pr-9 text-callout font-semibold text-text-primary">{title}</h2>
        )}
        {children}
      </div>
    </div>,
    document.getElementById('portal-root') || document.body,
  )
}
