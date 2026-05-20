import { describe, it, expect, beforeEach } from 'vitest'
import { useShortcutsStore } from '@/store/useShortcutsStore'

const DEFAULTS = [
  { id: 'google', title: 'Google', url: 'https://www.google.com' },
  { id: 'github', title: 'GitHub', url: 'https://github.com' },
  { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com' },
  { id: 'twitter', title: 'X', url: 'https://x.com' },
  { id: 'chatgpt', title: 'ChatGPT', url: 'https://chat.openai.com' },
  { id: 'claude', title: 'Claude', url: 'https://claude.ai' },
]

beforeEach(() => {
  useShortcutsStore.setState({ items: DEFAULTS })
})

describe('useShortcutsStore', () => {
  it('has correct default items', () => {
    const items = useShortcutsStore.getState().items
    expect(items).toHaveLength(6)
    expect(items[0].id).toBe('google')
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
    const reordered = [DEFAULTS[1], DEFAULTS[0], ...DEFAULTS.slice(2)]
    useShortcutsStore.getState().reorder(reordered)
    const items = useShortcutsStore.getState().items
    expect(items).toHaveLength(6)
    expect(items[0].id).toBe('github')
    expect(items[1].id).toBe('google')
  })
})
