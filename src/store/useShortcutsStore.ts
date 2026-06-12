import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration, registerRemoteSync } from './storage'
import type { Shortcut } from '@/types/widget'
import { isLikelyChinaLocale } from '@/lib/region'

interface ShortcutsState {
  items: Shortcut[]
  add: (shortcut: Omit<Shortcut, 'id'>) => void
  update: (id: string, patch: Partial<Omit<Shortcut, 'id'>>) => void
  remove: (id: string) => void
  reorder: (items: Shortcut[]) => void
}

export const GLOBAL_DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'google', title: 'Google', url: 'https://www.google.com' },
  { id: 'github', title: 'GitHub', url: 'https://github.com' },
  { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com' },
  { id: 'twitter', title: 'X', url: 'https://x.com' },
  { id: 'chatgpt', title: 'ChatGPT', url: 'https://chat.openai.com' },
  { id: 'claude', title: 'Claude', url: 'https://claude.ai' },
]

export const CN_DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'baidu', title: '百度', url: 'https://www.baidu.com' },
  { id: 'bilibili', title: '哔哩哔哩', url: 'https://www.bilibili.com' },
  { id: 'zhihu', title: '知乎', url: 'https://www.zhihu.com' },
  { id: 'weibo', title: '微博', url: 'https://weibo.com' },
  { id: 'douban', title: '豆瓣', url: 'https://www.douban.com' },
  { id: 'github', title: 'GitHub', url: 'https://github.com' },
]

export function getDefaultShortcuts(languages?: readonly string[]): Shortcut[] {
  const source = isLikelyChinaLocale(languages ? [...languages] : undefined)
    ? CN_DEFAULT_SHORTCUTS
    : GLOBAL_DEFAULT_SHORTCUTS
  return source.map((item) => ({ ...item }))
}

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set) => ({
      items: getDefaultShortcuts(),
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
    },
  ),
)

registerHydration(() => useShortcutsStore.persist.rehydrate())
registerRemoteSync('tab:shortcuts', () => useShortcutsStore.persist.rehydrate())
