import type { StateStorage } from 'zustand/middleware'

const isExtension = typeof chrome !== 'undefined' && !!chrome.storage?.local

export const chromeStorage: StateStorage = {
  getItem: async (name) => {
    if (!isExtension) return localStorage.getItem(name)
    const result = await chrome.storage.local.get(name)
    return (result[name] as string) ?? null
  },
  setItem: async (name, value) => {
    if (!isExtension) {
      localStorage.setItem(name, value)
      return
    }
    await chrome.storage.local.set({ [name]: value })
  },
  removeItem: async (name) => {
    if (!isExtension) {
      localStorage.removeItem(name)
      return
    }
    await chrome.storage.local.remove(name)
  },
}

const hydrationCallbacks = new Set<() => Promise<void> | void>()

export function registerHydration(cb: () => Promise<void> | void) {
  hydrationCallbacks.add(cb)
}

export async function hydrateStores() {
  await Promise.all([...hydrationCallbacks].map((cb) => cb()))
}
