import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Info, X } from 'lucide-react'
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
        <div className="fixed bottom-4 right-4 z-toast flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="material-pop animate-rise-in flex items-start gap-2.5 rounded-[16px] py-2.5 pl-3 pr-2.5 text-body text-text-primary"
              role="alert"
            >
              {t.type === 'error' ? (
                <AlertCircle size={16} className="mt-px shrink-0 text-danger" aria-hidden />
              ) : (
                <Info size={16} className="mt-px shrink-0 text-accent" aria-hidden />
              )}
              <span className="min-w-0 flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-fill hover:text-text-primary"
                aria-label="关闭"
              >
                <X size={12} strokeWidth={2.25} />
              </button>
            </div>
          ))}
        </div>,
        document.getElementById('portal-root') || document.body,
      )}
    </>
  )
}
