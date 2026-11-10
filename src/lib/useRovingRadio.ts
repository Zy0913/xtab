import { useRef, type KeyboardEvent } from 'react'

/**
 * Keyboard behaviour for a radio group with a roving tabindex: arrow keys,
 * Home and End move the selection and the focus together, and only the
 * selected item sits in the tab order (the caller sets tabIndex).
 */
export function useRovingRadio(count: number, select: (index: number) => void) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = count - 1
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next < 0) return
    e.preventDefault()
    select(next)
    refs.current[next]?.focus()
  }

  const register = (index: number) => (el: HTMLButtonElement | null) => {
    refs.current[index] = el
  }

  return { register, onKeyDown }
}
