import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/lib/useFocusTrap'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** The key that opens the panel. It keeps working while the panel is open,
   *  so it closes it again; other page shortcuts wait (useShortcut). */
  shortcut?: string
}

/**
 * Floating side panel, inset from the window edges like a macOS 27 inspector.
 * The scrim stays light and unblurred so the dashboard remains visible.
 */
export function Drawer({ open, onClose, title, children, shortcut }: Props) {
  const trapRef = useFocusTrap(open)

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

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-drawer transition-opacity duration-slow',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={{ backgroundColor: 'var(--scrim)' }}
        onClick={onClose}
      />
      <aside
        ref={trapRef}
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-hidden={open ? undefined : true}
        aria-keyshortcuts={shortcut}
        aria-label={title}
        className={cn(
          'material-pop fixed bottom-3 right-3 top-3 z-drawer flex w-[380px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden overscroll-contain rounded-panel outline-none transition-[transform,opacity,visibility] duration-slow',
          open
            ? 'visible translate-x-0 opacity-100'
            : 'pointer-events-none invisible translate-x-full opacity-0',
        )}
      >
        <header className="flex h-[3.25rem] shrink-0 items-center justify-between pl-5 pr-3.5">
          <h2 className="text-callout font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-fill hover:text-text-primary"
            aria-label="关闭设置"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pb-5">{children}</div>
      </aside>
    </>
  )
}
