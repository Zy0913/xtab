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
    if (chrome.runtime.lastError) {
      console.error(`chrome.storage.local.set("${name}") failed:`, chrome.runtime.lastError.message)
    }
  },
  removeItem: async (name) => {
    if (!isExtension) {
      localStorage.removeItem(name)
      return
    }
    await chrome.storage.local.remove(name)
    if (chrome.runtime.lastError) {
      console.error(`chrome.storage.local.remove("${name}") failed:`, chrome.runtime.lastError.message)
    }
  },
}

const hydrationCallbacks = new Set<() => Promise<void> | void>()
const remoteChangeHandlers = new Map<string, () => Promise<void> | void>()

export function registerHydration(cb: () => Promise<void> | void) {
  hydrationCallbacks.add(cb)
}

export async function hydrateStores() {
  await Promise.all([...hydrationCallbacks].map((cb) => cb()))
}

/**
 * Subscribe a store to remote chrome.storage.local changes so multiple new-tab
 * pages stay in sync. The callback should re-hydrate the store from storage.
 */
export function registerRemoteSync(name: string, cb: () => Promise<void> | void) {
  remoteChangeHandlers.set(name, cb)
}

export function initRemoteSync() {
  if (!isExtension || !chrome.storage.onChanged) return
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    for (const key of Object.keys(changes)) {
      const handler = remoteChangeHandlers.get(key)
      if (handler) void handler()
    }
  })
}
