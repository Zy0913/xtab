/**
 * Wallpapers picked from the computer.
 *
 * An upload is kept as a Blob in IndexedDB and the settings hold only its key
 * ("local:…"). The settings are written whole on every change and sent to
 * every open tab, so a picture of tens of megabytes inside them would be
 * copied each time, say, the dimming slider moved.
 *
 * Uploads have a database of their own: the wallpaper cache throws away what
 * isn't on screen and must never take an upload with it.
 */

const DB_NAME = 'tab-wallpaper-uploads'
const STORE = 'files'
const PREFIX = 'local:'

/** The largest file taken: room for a 4K PNG, and for 8K as JPEG or WebP. */
export const MAX_UPLOAD_MB = 50
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

/** The most pixels kept, those of 8K (7680×4320): more than any screen shows.
    A larger picture is scaled down to it. */
export const MAX_WALLPAPER_PIXELS = 7680 * 4320

/** WebP holds no picture wider or taller than this. */
const WEBP_MAX_EDGE = 16383
const WEBP_QUALITY = 0.92

/** An upload this recent is kept even while no wallpaper uses it: another
    tab may have just picked it and not yet told this one. */
const GRACE_MS = 60_000

export function isLocalWallpaper(url: string | null | undefined): boolean {
  return !!url && url.startsWith(PREFIX)
}

/** The time an upload was kept, read from its key. */
function keptAt(key: string): number {
  const t = parseInt(key.slice(PREFIX.length).split('-')[0], 36)
  return Number.isFinite(t) ? t : 0
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Runs one transaction on the store and settles once it has completed. */
async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDB()
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req ? req.result : undefined)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'))
    })
  } finally {
    db.close()
  }
}

/** Keeps a picture and returns the key for the settings. Throws when it
    couldn't be kept, so that no setting ever points at nothing. */
export async function saveLocalWallpaper(blob: Blob): Promise<string> {
  const key = `${PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  await withStore('readwrite', (store) => store.put(blob, key))
  return key
}

/** The picture behind a key, or null when this browser doesn't hold it. */
export async function readLocalWallpaper(key: string): Promise<Blob | null> {
  try {
    const blob = await withStore<unknown>('readonly', (store) => store.get(key))
    return blob instanceof Blob ? blob : null
  } catch {
    return null
  }
}

/** The uploads to delete: all but `keep` and the ones kept in the last minute. */
export function staleUploads(keys: readonly string[], keep: string | null, now: number): string[] {
  return keys.filter((key) => key !== keep && now - keptAt(key) > GRACE_MS)
}

/** Deletes the uploads no wallpaper uses any more. */
export async function pruneLocalWallpapers(keep: string | null): Promise<void> {
  try {
    await withStore('readwrite', (store) => {
      const keys = store.getAllKeys()
      keys.onsuccess = () => {
        for (const key of staleUploads(keys.result.map(String), keep, Date.now())) {
          store.delete(key)
        }
      }
    })
  } catch {
    // Best effort: the next settled wallpaper tries again.
  }
}

/** Turns a data URL back into the file it holds. Throws if it isn't one. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^,]*?)(;base64)?,(.*)$/s.exec(dataUrl)
  if (!match) throw new Error('Not a data URL')
  const [, type, base64, data] = match
  if (!base64) return new Blob([decodeURIComponent(data)], { type })
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

/** Thrown when the browser can't open a file as a picture (HEIC, say). */
export class UnreadableImageError extends Error {
  constructor() {
    super('Unreadable image')
    this.name = 'UnreadableImageError'
  }
}

export interface Size {
  width: number
  height: number
}

/** The size a picture is kept at: as it is up to 8K, else scaled down to 8K
    in the same proportions (and to no edge longer than WebP takes). */
export function fitWithin(width: number, height: number, maxPixels = MAX_WALLPAPER_PIXELS): Size {
  if (width * height <= maxPixels) return { width, height }
  const scale = Math.min(
    Math.sqrt(maxPixels / (width * height)),
    WEBP_MAX_EDGE / Math.max(width, height),
  )
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  }
}

/** Loads a picture far enough to know its size, as shown (EXIF rotation
    included). The pixels themselves aren't decoded yet. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new UnreadableImageError())
    img.src = src
  })
}

async function shrink(img: HTMLImageElement, { width, height }: Size): Promise<Blob> {
  const bitmap = await createImageBitmap(img, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: 'high',
  })
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2D canvas')
    ctx.drawImage(bitmap, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    )
    if (!blob) throw new Error('Could not encode the picture')
    return blob
  } finally {
    bitmap.close()
  }
}

export interface PreparedWallpaper {
  blob: Blob
  /** The new size, when the picture was larger than 8K and was scaled down. */
  resizedTo: Size | null
}

/**
 * Readies a picked file to be the wallpaper. A picture up to 8K is kept byte
 * for byte, so it looks exactly as it did; a larger one is scaled down to 8K
 * and saved as WebP. Throws UnreadableImageError for a file the browser can't
 * show.
 */
export async function prepareWallpaper(file: File): Promise<PreparedWallpaper> {
  const src = URL.createObjectURL(file)
  try {
    const img = await loadImage(src)
    // A vector picture is sharp at any size, and may have no size at all.
    if (file.type === 'image/svg+xml') return { blob: file, resizedTo: null }
    const { naturalWidth: width, naturalHeight: height } = img
    if (!width || !height) throw new UnreadableImageError()
    const target = fitWithin(width, height)
    if (target.width === width && target.height === height) return { blob: file, resizedTo: null }
    return { blob: await shrink(img, target), resizedTo: target }
  } finally {
    URL.revokeObjectURL(src)
  }
}
