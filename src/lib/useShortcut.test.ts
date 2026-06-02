import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useShortcut } from './useShortcut'

function fireKeyDown(
  key: string,
  opts: { ctrl?: boolean; meta?: boolean; alt?: boolean; shift?: boolean; target?: Element } = {},
) {
  const el = opts.target ?? document.body
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: opts.ctrl ?? false,
    metaKey: opts.meta ?? false,
    altKey: opts.alt ?? false,
    shiftKey: opts.shift ?? false,
    bubbles: true,
  })
  el.dispatchEvent(event)
  return event
}

describe('useShortcut', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.tabIndex = 0
    document.body.focus()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('fires handler on matching key', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    fireKeyDown('e')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ignores non-matching key', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    fireKeyDown('x')
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores when Ctrl is held', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    fireKeyDown('e', { ctrl: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores when Meta (Cmd) is held', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    fireKeyDown('e', { meta: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores when Alt is held', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    fireKeyDown('e', { alt: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it('fires for Shift+? (requiresShift key)', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('?', handler))
    fireKeyDown('?', { shift: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ignores ? without Shift', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('?', handler))
    fireKeyDown('?', { shift: false })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores keys inside INPUT elements', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireKeyDown('e', { target: input })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores keys inside TEXTAREA elements', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.focus()
    fireKeyDown('e', { target: textarea })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores keys inside contentEditable elements', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    const div = document.createElement('div')
    // jsdom doesn't fully support isContentEditable — force it
    Object.defineProperty(div, 'isContentEditable', { value: true })
    document.body.appendChild(div)
    div.focus()
    fireKeyDown('e', { target: div })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores keys inside elements with role="textbox"', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    const div = document.createElement('div')
    div.setAttribute('role', 'textbox')
    document.body.appendChild(div)
    div.focus()
    fireKeyDown('e', { target: div })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores keys inside elements with role="searchbox"', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    const div = document.createElement('div')
    div.setAttribute('role', 'searchbox')
    document.body.appendChild(div)
    div.focus()
    fireKeyDown('e', { target: div })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores keys inside elements with role="combobox"', () => {
    const handler = vi.fn()
    renderHook(() => useShortcut('e', handler))
    const div = document.createElement('div')
    div.setAttribute('role', 'combobox')
    document.body.appendChild(div)
    div.focus()
    fireKeyDown('e', { target: div })
    expect(handler).not.toHaveBeenCalled()
  })

  it('cleans up listener on unmount', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useShortcut('e', handler))
    unmount()
    fireKeyDown('e')
    expect(handler).not.toHaveBeenCalled()
  })

  it('updates handler via ref without re-subscribing', () => {
    let current = vi.fn()
    const { rerender } = renderHook(() => useShortcut('e', current))
    fireKeyDown('e')
    expect(current).toHaveBeenCalledTimes(1)

    const handler2 = vi.fn()
    current = handler2
    rerender()
    fireKeyDown('e')
    expect(handler2).toHaveBeenCalledTimes(1)
  })
})
