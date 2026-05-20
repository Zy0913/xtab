import { describe, it, expect, beforeEach } from 'vitest'
import { useTodoStore } from '@/store/useTodoStore'

beforeEach(() => {
  useTodoStore.setState({ items: [] })
})

describe('useTodoStore', () => {
  it('starts with empty items', () => {
    expect(useTodoStore.getState().items).toEqual([])
  })

  it('add creates a new todo', () => {
    useTodoStore.getState().add('Buy milk')
    const items = useTodoStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].text).toBe('Buy milk')
    expect(items[0].done).toBe(false)
    expect(items[0].id).toBeTruthy()
    expect(items[0].createdAt).toBeGreaterThan(0)
  })

  it('add trims whitespace', () => {
    useTodoStore.getState().add('  Hello  ')
    expect(useTodoStore.getState().items[0].text).toBe('Hello')
  })

  it('add prepends to the list', () => {
    useTodoStore.getState().add('First')
    useTodoStore.getState().add('Second')
    const items = useTodoStore.getState().items
    expect(items).toHaveLength(2)
    expect(items[0].text).toBe('Second')
    expect(items[1].text).toBe('First')
  })

  it('toggle flips done state', () => {
    useTodoStore.getState().add('Task')
    const id = useTodoStore.getState().items[0].id
    expect(useTodoStore.getState().items[0].done).toBe(false)
    useTodoStore.getState().toggle(id)
    expect(useTodoStore.getState().items[0].done).toBe(true)
    useTodoStore.getState().toggle(id)
    expect(useTodoStore.getState().items[0].done).toBe(false)
  })

  it('toggle on non-existent id is harmless', () => {
    useTodoStore.getState().add('Task')
    useTodoStore.getState().toggle('nonexistent')
    expect(useTodoStore.getState().items).toHaveLength(1)
  })

  it('remove deletes a todo', () => {
    useTodoStore.getState().add('A')
    useTodoStore.getState().add('B')
    const id = useTodoStore.getState().items[0].id
    useTodoStore.getState().remove(id)
    const items = useTodoStore.getState().items
    expect(items).toHaveLength(1)
  })

  it('clearCompleted removes only done items', () => {
    // add prepends, so Pending task ends up at index 0, Done task at index 1
    useTodoStore.getState().add('Done task')
    useTodoStore.getState().add('Pending task')
    // toggle Done task (at index 1)
    const doneId = useTodoStore.getState().items[1].id
    useTodoStore.getState().toggle(doneId)

    useTodoStore.getState().clearCompleted()
    const items = useTodoStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].text).toBe('Pending task')
    expect(items[0].done).toBe(false)
  })

  it('clearCompleted with no done items does nothing', () => {
    useTodoStore.getState().add('A')
    useTodoStore.getState().add('B')
    useTodoStore.getState().clearCompleted()
    expect(useTodoStore.getState().items).toHaveLength(2)
  })
})
