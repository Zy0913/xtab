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

/**
 * Load a wallpaper URL via cache when possible. Returns an object URL (or the
 * original URL as a fallback). Always kicks off a background fetch to refresh
 * the cache if the entry was missing.
 */
export async function resolveWallpaper(
  url: string,
): Promise<{ objectUrl: string; fromCache: boolean }> {
  // Data URLs and blob URLs can't be cached via fetch — return as-is.
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return { objectUrl: url, fromCache: false }
  }
  const cached = await readCachedBlob(url)
  if (cached) {
    return { objectUrl: URL.createObjectURL(cached), fromCache: true }
  }
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return { objectUrl: url, fromCache: false }
    const blob = await res.blob()
    void writeCachedBlob(url, blob)
    return { objectUrl: URL.createObjectURL(blob), fromCache: false }
  } catch {
    return { objectUrl: url, fromCache: false }
  }
}
