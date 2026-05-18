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
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />
      <aside
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed right-0 top-0 z-50 flex h-screen w-[380px] max-w-[90vw] flex-col border-l border-border bg-surface-strong shadow-pop backdrop-blur-glass transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex h-12 items-center justify-between border-b border-border px-5">
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-text-secondary hover:bg-surface hover:text-text-primary transition"
            aria-label="关闭设置"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </>
  )
}
