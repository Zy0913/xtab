import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration, registerRemoteSync } from './storage'
import type { Shortcut } from '@/types/widget'

interface ShortcutsState {
  items: Shortcut[]
  add: (shortcut: Omit<Shortcut, 'id'>) => void
  update: (id: string, patch: Partial<Omit<Shortcut, 'id'>>) => void
  remove: (id: string) => void
  reorder: (items: Shortcut[]) => void
}

const DEFAULTS: Shortcut[] = [
  { id: 'google', title: 'Google', url: 'https://www.google.com' },
  { id: 'github', title: 'GitHub', url: 'https://github.com' },
  { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com' },
  { id: 'twitter', title: 'X', url: 'https://x.com' },
  { id: 'chatgpt', title: 'ChatGPT', url: 'https://chat.openai.com' },
  { id: 'claude', title: 'Claude', url: 'https://claude.ai' },
]

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set) => ({
      items: DEFAULTS,
      add: (shortcut) =>
        set((s) => ({
          items: [...s.items, { ...shortcut, id: crypto.randomUUID() }],
        })),
      update: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
      reorder: (items) => set({ items }),
    }),
    {
      name: 'tab:shortcuts',
      storage: createJSONStorage(() => chromeStorage),
      skipHydration: true,
      version: 1,
      migrate: (persisted) => persisted,
    },
  ),
)

registerHydration(() => useShortcutsStore.persist.rehydrate())
registerRemoteSync('tab:shortcuts', () => useShortcutsStore.persist.rehydrate())
