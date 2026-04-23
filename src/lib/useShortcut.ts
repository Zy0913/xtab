import { useEffect } from 'react'

type Handler = (event: KeyboardEvent) => void

export function useShortcut(key: string, handler: Handler) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== key) return
      const target = e.target as HTMLElement | null
      if (!target) return
      // Skip if focus is inside any editable or interactive element
      const tag = target.tagName
      const role = target.getAttribute('role')
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) ||
        target.isContentEditable ||
        role === 'textbox' ||
        role === 'searchbox' ||
        role === 'combobox'
      )
        return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, handler])
}
