import { isLocalWallpaper, readLocalWallpaper } from './localWallpaper'
import { DEFAULT_WALLPAPER } from './wallpapers'

const DB_NAME = 'tab-wallpaper-cache'
const STORE = 'blobs'
const VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function txBlob(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest | void,
): Promise<unknown> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    const req = fn(store)
    tx.oncomplete = () => resolve(req && 'result' in req ? req.result : undefined)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function readCachedBlob(url: string): Promise<Blob | null> {
  try {
    const blob = (await txBlob('readonly', (s) => s.get(url))) as Blob | undefined
    return blob ?? null
  } catch {
    return null
  }
}

export async function writeCachedBlob(url: string, blob: Blob): Promise<void> {
  try {
    await txBlob('readwrite', (s) => s.put(blob, url))
  } catch {
    // ignore quota / db errors — cache is best-effort
  }
}

export async function evictOthers(keepUrl: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const keys = store.getAllKeys()
      keys.onsuccess = () => {
        for (const k of keys.result as IDBValidKey[]) {
          if (k !== keepUrl) store.delete(k)
        }
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    })
  } catch {
    // ignore
  }
}

/** In-flight warm caches so concurrent resolveWallpaper calls share one fetch. */
const warmInflight = new Map<string, Promise<void>>()

/**
 * Download into IndexedDB without blocking display. Used so the next open is
 * instant and tint extraction can read a same-origin blob.
 */
export function warmWallpaperCache(url: string): Promise<void> {
  if (!url || url.startsWith('data:') || url.startsWith('blob:') || isLocalWallpaper(url)) {
    return Promise.resolve()
  }
  const existing = warmInflight.get(url)
  if (existing) return existing

  const job = (async () => {
    try {
      const cached = await readCachedBlob(url)
      if (cached) return
      const res = await fetch(url, { mode: 'cors' })
      if (!res.ok) return
      await writeCachedBlob(url, await res.blob())
    } catch {
      // best-effort
    } finally {
      warmInflight.delete(url)
    }
  })()

  warmInflight.set(url, job)
  return job
}

/**
 * The picture behind a wallpaper setting: its bytes when this browser holds
 * them (an upload, or a download already cached), else the address to load
 * it from. An upload this browser doesn't hold, from a backup made elsewhere
 * say, gives the default wallpaper.
 */
export async function wallpaperSource(url: string): Promise<Blob | string> {
  if (isLocalWallpaper(url)) return (await readLocalWallpaper(url)) ?? DEFAULT_WALLPAPER
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  return (await readCachedBlob(url)) ?? url
}

/**
 * Resolve a displayable wallpaper URL as fast as possible.
 *
 * - Held locally → blob: object URL (instant local paint)
 * - Cache miss → return the remote URL immediately and warm the cache in the
 *   background. Waiting for a full multi‑MB re-download here made random /
 *   API wallpaper switches feel stuck between the old and new image.
 */
export async function resolveWallpaper(
  url: string,
): Promise<{ objectUrl: string; fromCache: boolean }> {
  const source = await wallpaperSource(url)
  if (typeof source !== 'string') {
    return { objectUrl: URL.createObjectURL(source), fromCache: true }
  }
  if (source === url) void warmWallpaperCache(url)
  return { objectUrl: source, fromCache: false }
}
