import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration, registerRemoteSync } from './storage'

export interface TodoItem {
  id: string
  text: string
  done: boolean
  createdAt: number
}

interface TodoState {
  items: TodoItem[]
  add: (text: string) => void
  toggle: (id: string) => void
  remove: (id: string) => void
  clearCompleted: () => void
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      items: [],
      add: (text) =>
        set((s) => ({
          items: [
            {
              id: crypto.randomUUID(),
              text: text.trim(),
              done: false,
              createdAt: Date.now(),
            },
            ...s.items,
          ],
        })),
      toggle: (id) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
      clearCompleted: () => set((s) => ({ items: s.items.filter((it) => !it.done) })),
    }),
    {
      name: 'tab:todo',
      storage: createJSONStorage(() => chromeStorage),
      skipHydration: true,
      version: 1,
    },
  ),
)

registerHydration(() => useTodoStore.persist.rehydrate())
registerRemoteSync('tab:todo', () => useTodoStore.persist.rehydrate())
