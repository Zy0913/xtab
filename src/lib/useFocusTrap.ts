import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const container = containerRef.current
    if (!container) return

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

    // Ensure container can receive focus when no focusable children exist
    if (!container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '-1')
    }

    // Focus the first focusable element, or the container itself
    requestAnimationFrame(() => {
      const focusable = getFocusable()
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        container.focus()
      }
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusable = getFocusable()
      if (focusable.length === 0) {
        // No focusable elements — keep focus trapped on container
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === container) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [active])

  return containerRef
}
