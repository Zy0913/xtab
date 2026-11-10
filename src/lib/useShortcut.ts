import { useEffect, useRef } from 'react'

type Handler = (event: KeyboardEvent) => void

// Keys whose canonical form already encodes Shift (e.g. `?` is Shift+/, `T`
// is Shift+t). For these we MUST allow the Shift modifier; for everything
// else, Shift is treated as an explicit modifier and the shortcut is skipped.
function requiresShift(key: string): boolean {
  return key.length === 1 && key !== key.toLowerCase()
    ? true
    : /^[?!@#$%^&*()_+{}|:"<>~]$/.test(key)
}

/**
 * A modal makes the page behind it inert, so the page's shortcuts are inert
 * too. Only the topmost modal's own key (its aria-keyshortcuts, such as "," on
 * the settings panel) still works, so the key that opened a panel closes it.
 */
function blockedByModal(key: string): boolean {
  const modals = document.querySelectorAll('[aria-modal="true"]')
  const top = modals[modals.length - 1]
  if (!top) return false
  return !(top.getAttribute('aria-keyshortcuts')?.split(' ') ?? []).includes(key)
}

export function useShortcut(key: string, handler: Handler) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== key) return
      // Reject Ctrl / Cmd / Alt so we don't fight browser/OS shortcuts
      // (e.g. Ctrl+E focuses the omnibox in some setups, Cmd+, opens browser
      // settings on macOS). Shift handling is key-dependent — see helper.
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.shiftKey !== requiresShift(key)) return
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
      if (blockedByModal(key)) return
      e.preventDefault()
      handlerRef.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key])
}
