import { describe, it, expect, beforeEach } from 'vitest'
import {
  GLOBAL_DEFAULT_SHORTCUTS,
  getDefaultShortcuts,
  useShortcutsStore,
} from '@/store/useShortcutsStore'

beforeEach(() => {
  useShortcutsStore.setState({ items: getDefaultShortcuts(['en-US']) })
})

describe('useShortcutsStore', () => {
  it('has correct default items', () => {
    const items = useShortcutsStore.getState().items
    expect(items).toHaveLength(6)
    expect(items[0].id).toBe('google')
  })

  it('uses CN-friendly default items for mainland Chinese locale', () => {
    const items = getDefaultShortcuts(['zh-CN'])
    expect(items).toHaveLength(6)
    expect(items[0]).toEqual({ id: 'baidu', title: '百度', url: 'https://www.baidu.com' })
    expect(items.some((item) => item.url.includes('youtube.com'))).toBe(false)
  })

  it('add inserts a new shortcut', () => {
    useShortcutsStore.getState().add({ title: 'New', url: 'https://new.com' })
    const items = useShortcutsStore.getState().items
    expect(items).toHaveLength(7)
    // add appends, so the new item is last
    const added = items[items.length - 1]
    expect(added.title).toBe('New')
    expect(added.url).toBe('https://new.com')
    expect(added.id).toBeTruthy()
  })

  it('update modifies an existing shortcut', () => {
    useShortcutsStore.getState().update('google', { title: 'Updated Google' })
    const items = useShortcutsStore.getState().items
    expect(items[0].title).toBe('Updated Google')
    expect(items[0].url).toBe('https://www.google.com')
  })

  it('update on non-existent id does nothing harmful', () => {
    useShortcutsStore.getState().update('nonexistent', { title: 'X' })
    const items = useShortcutsStore.getState().items
    expect(items).toHaveLength(6)
  })

  it('remove deletes a shortcut', () => {
    useShortcutsStore.getState().remove('google')
    const items = useShortcutsStore.getState().items
    expect(items).toHaveLength(5)
    expect(items.find((it) => it.id === 'google')).toBeUndefined()
  })

  it('remove on non-existent id is harmless', () => {
    useShortcutsStore.getState().remove('nonexistent')
    expect(useShortcutsStore.getState().items).toHaveLength(6)
  })

  it('reorder replaces entire items array', () => {
    const reordered = [
      GLOBAL_DEFAULT_SHORTCUTS[1],
      GLOBAL_DEFAULT_SHORTCUTS[0],
      ...GLOBAL_DEFAULT_SHORTCUTS.slice(2),
    ]
    useShortcutsStore.getState().reorder(reordered)
    const items = useShortcutsStore.getState().items
    expect(items).toHaveLength(6)
    expect(items[0].id).toBe('github')
    expect(items[1].id).toBe('google')
  })
})
