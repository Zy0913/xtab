import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { setToastHandler } from '@/lib/toast'

interface Toast {
  id: number
  message: string
  type: 'info' | 'error'
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextIdRef = useRef(0)

  const addToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    const id = nextIdRef.current++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    setToastHandler(addToast)
    return () => setToastHandler(() => {})
  }, [addToast])

  return (
    <>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                'animate-toast-in flex items-center gap-2 rounded-card border px-4 py-2.5 text-sm shadow-pop backdrop-blur-pop',
                t.type === 'error'
                  ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'border-border bg-surface-strong text-text-primary',
              )}
              role="alert"
            >
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="shrink-0 rounded p-0.5 hover:bg-surface"
                aria-label="关闭"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>,
        document.getElementById('portal-root') || document.body,
      )}
    </>
  )
}
