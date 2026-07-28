import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/lib/useFocusTrap'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, children }: Props) {
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
          'fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />
      <aside
        ref={trapRef}
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-hidden={open ? undefined : true}
        aria-label={title}
        className={cn(
          'backdrop-blur-glass glass-noise fixed right-0 top-0 z-[60] flex h-screen w-[400px] max-w-[92vw] flex-col border-l border-border bg-surface-strong shadow-pop transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          open ? 'visible translate-x-0' : 'pointer-events-none invisible translate-x-full',
        )}
      >
        <header className="border-border/80 relative z-[2] flex h-14 items-center justify-between border-b px-5">
          <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-text-secondary transition hover:bg-surface hover:text-text-primary"
            aria-label="关闭设置"
          >
            <X size={16} />
          </button>
        </header>
        <div className="relative z-[2] flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </>
  )
}
