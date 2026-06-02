import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'

// --- chromeStorage tests ---
// isExtension is a module-level const, so we use dynamic import + vi.resetModules

describe('chromeStorage (browser fallback)', () => {
  let chromeStorage: Awaited<typeof import('./storage')>['chromeStorage']

  beforeEach(async () => {
    vi.resetModules()
    // Ensure chrome is undefined for this test suite
    // @ts-expect-error — simulating non-extension env
    delete globalThis.chrome
    localStorage.clear()
    const mod = await import('./storage')
    chromeStorage = mod.chromeStorage
  })

  afterEach(() => localStorage.clear())

  it('getItem returns null for missing key', async () => {
    expect(await chromeStorage.getItem('nope')).toBeNull()
  })

  it('setItem stores and getItem retrieves', async () => {
    await chromeStorage.setItem('k', '"v"')
    expect(await chromeStorage.getItem('k')).toBe('"v"')
  })

  it('removeItem deletes the key', async () => {
    await chromeStorage.setItem('k', '"v"')
    await chromeStorage.removeItem('k')
    expect(await chromeStorage.getItem('k')).toBeNull()
  })
})

describe('chromeStorage (extension mode)', () => {
  let storageData: Record<string, string>
  let chromeStorage: Awaited<typeof import('./storage')>['chromeStorage']

  beforeEach(async () => {
    vi.resetModules()
    storageData = {}
    globalThis.chrome = {
      storage: {
        local: {
          get: vi.fn(async (name: string) => ({ [name]: storageData[name] })),
          set: vi.fn(async (items: Record<string, string>) => {
            Object.assign(storageData, items)
          }),
          remove: vi.fn(async (name: string) => {
            delete storageData[name]
          }),
        },
      },
      runtime: { lastError: null as unknown },
    } as unknown as typeof chrome

    const mod = await import('./storage')
    chromeStorage = mod.chromeStorage
  })

  afterEach(() => {
    // @ts-expect-error — cleanup
    delete globalThis.chrome
  })

  it('getItem reads from chrome.storage.local', async () => {
    storageData['mykey'] = '{"x":1}'
    expect(await chromeStorage.getItem('mykey')).toBe('{"x":1}')
  })

  it('getItem returns null for missing key', async () => {
    expect(await chromeStorage.getItem('missing')).toBeNull()
  })

  it('setItem writes to chrome.storage.local', async () => {
    await chromeStorage.setItem('k', '"v"')
    expect(storageData['k']).toBe('"v"')
  })

  it('removeItem deletes from chrome.storage.local', async () => {
    storageData['del'] = 'data'
    await chromeStorage.removeItem('del')
    expect(storageData['del']).toBeUndefined()
  })

  it('logs error on runtime.lastError after set', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    globalThis.chrome.runtime.lastError = {
      message: 'QUOTA_EXCEEDED',
    } as unknown as chrome.runtime.LastError
    await chromeStorage.setItem('k', '"v"')
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('chrome.storage.local.set'),
      'QUOTA_EXCEEDED',
    )
    spy.mockRestore()
  })
})

// --- hydrateStores tests ---
// hydrationCallbacks is module-scoped; we use a fresh module import for isolation

describe('hydrateStores', () => {
  beforeEach(() => vi.resetModules())

  it('runs all registered callbacks', async () => {
    const { registerHydration, hydrateStores } = await import('./storage')
    const a = vi.fn()
    const b = vi.fn()
    registerHydration(a)
    registerHydration(b)
    await hydrateStores()
    expect(a).toHaveBeenCalled()
    expect(b).toHaveBeenCalled()
  })

  it('tolerates individual callback failures (allSettled)', async () => {
    const { registerHydration, hydrateStores } = await import('./storage')
    const a = vi.fn()
    const b = vi.fn().mockRejectedValue(new Error('boom'))
    const c = vi.fn()
    registerHydration(a)
    registerHydration(b)
    registerHydration(c)
    await expect(hydrateStores()).resolves.toBeUndefined()
    expect(a).toHaveBeenCalled()
    expect(b).toHaveBeenCalled()
    expect(c).toHaveBeenCalled()
  })
})

// --- remoteSync tests ---

describe('registerRemoteSync / initRemoteSync', () => {
  let listeners: Array<(changes: Record<string, unknown>, area: string) => void>

  beforeEach(async () => {
    vi.resetModules()
    listeners = []
  })

  afterEach(() => {
    // @ts-expect-error — cleanup
    delete globalThis.chrome
  })

  it('no-ops when chrome.storage.onChanged is unavailable', async () => {
    // @ts-expect-error — simulating non-extension env
    delete globalThis.chrome
    const { initRemoteSync } = await import('./storage')
    initRemoteSync() // should not throw
  })

  it('dispatches handler on chrome.storage.local change', async () => {
    const handler = vi.fn()
    globalThis.chrome = {
      storage: {
        local: {},
        onChanged: {
          addListener: (fn: (changes: Record<string, unknown>, area: string) => void) => {
            listeners.push(fn)
          },
        },
      },
    } as unknown as typeof chrome

    const { registerRemoteSync, initRemoteSync } = await import('./storage')
    registerRemoteSync('my-store', handler)
    initRemoteSync()
    expect(listeners).toHaveLength(1)
    listeners[0]!({ 'my-store': {} }, 'local')
    expect(handler).toHaveBeenCalled()
  })

  it('ignores non-local area changes', async () => {
    const handler = vi.fn()
    globalThis.chrome = {
      storage: {
        local: {},
        onChanged: {
          addListener: (fn: (changes: Record<string, unknown>, area: string) => void) => {
            listeners.push(fn)
          },
        },
      },
    } as unknown as typeof chrome

    const { registerRemoteSync, initRemoteSync } = await import('./storage')
    registerRemoteSync('sync-store', handler)
    initRemoteSync()
    listeners[0]!({ 'sync-store': {} }, 'sync')
    expect(handler).not.toHaveBeenCalled()
  })
})
