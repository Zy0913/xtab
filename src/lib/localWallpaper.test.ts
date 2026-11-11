import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  MAX_WALLPAPER_PIXELS,
  UnreadableImageError,
  blobToDataUrl,
  dataUrlToBlob,
  fitWithin,
  isLocalWallpaper,
  prepareWallpaper,
  staleUploads,
} from './localWallpaper'

describe('isLocalWallpaper', () => {
  it('knows an upload by its key', () => {
    expect(isLocalWallpaper('local:m3x1k2-abc123')).toBe(true)
    expect(isLocalWallpaper('https://example.com/local:x.jpg')).toBe(false)
    expect(isLocalWallpaper('data:image/png;base64,AAAA')).toBe(false)
    expect(isLocalWallpaper('')).toBe(false)
    expect(isLocalWallpaper(null)).toBe(false)
  })
})

describe('fitWithin', () => {
  it('keeps a picture up to 8K at its size', () => {
    expect(fitWithin(3840, 2160)).toEqual({ width: 3840, height: 2160 })
    expect(fitWithin(7680, 4320)).toEqual({ width: 7680, height: 4320 })
    // A tall phone picture under the 8K pixel count.
    expect(fitWithin(4000, 6000)).toEqual({ width: 4000, height: 6000 })
  })

  it('scales a larger picture down to the 8K pixel count, in proportion', () => {
    const { width, height } = fitWithin(12000, 8000)
    expect(width * height).toBeLessThanOrEqual(MAX_WALLPAPER_PIXELS)
    expect(width * height).toBeGreaterThan(MAX_WALLPAPER_PIXELS * 0.999)
    expect(width / height).toBeCloseTo(1.5, 3)
  })

  it('keeps a scaled-down panorama within what WebP holds', () => {
    const { width, height } = fitWithin(60000, 3000)
    expect(width).toBeLessThanOrEqual(16383)
    expect(width / height).toBeCloseTo(20, 1)
  })
})

describe('staleUploads', () => {
  const now = Date.UTC(2026, 10, 11)
  const key = (msAgo: number, tag = 'aaaaaa') => `local:${(now - msAgo).toString(36)}-${tag}`

  it('deletes uploads no wallpaper uses', () => {
    const inUse = key(3_600_000, 'inuse1')
    const old = key(3_600_000, 'old111')
    expect(staleUploads([inUse, old], inUse, now)).toEqual([old])
  })

  it('keeps an upload from the last minute, which another tab may be about to use', () => {
    const fresh = key(5_000)
    expect(staleUploads([fresh], 'https://example.com/w.jpg', now)).toEqual([])
  })

  it('deletes a key it cannot read a time from', () => {
    expect(staleUploads(['local:garbage'], null, now)).toEqual(['local:garbage'])
  })
})

describe('dataUrlToBlob', () => {
  it('decodes a base64 data URL', async () => {
    const blob = dataUrlToBlob('data:image/png;base64,iVBORw0K')
    expect(blob.type).toBe('image/png')
    expect([...new Uint8Array(await blob.arrayBuffer())]).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a,
    ])
  })

  it('decodes a percent-encoded one', async () => {
    const blob = dataUrlToBlob('data:image/svg+xml,%3Csvg%2F%3E')
    expect(blob.type).toBe('image/svg+xml')
    expect(await blob.text()).toBe('<svg/>')
  })

  it('round-trips with blobToDataUrl', async () => {
    const original = new Blob([new Uint8Array([0, 1, 2, 250, 255])], { type: 'image/webp' })
    const back = dataUrlToBlob(await blobToDataUrl(original))
    expect(back.type).toBe('image/webp')
    expect([...new Uint8Array(await back.arrayBuffer())]).toEqual([0, 1, 2, 250, 255])
  })

  it('throws for anything else', () => {
    expect(() => dataUrlToBlob('https://example.com/a.png')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// prepareWallpaper: the browser's image loading and canvas are stand-ins.
// ---------------------------------------------------------------------------

let picture: { width: number; height: number } | 'broken'

class FakeImage {
  naturalWidth = 0
  naturalHeight = 0
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  set src(_: string) {
    queueMicrotask(() => {
      if (picture === 'broken') return this.onerror?.()
      this.naturalWidth = picture.width
      this.naturalHeight = picture.height
      this.onload?.()
    })
  }
}

describe('prepareWallpaper', () => {
  const webp = new Blob(['webp'], { type: 'image/webp' })
  const createImageBitmap = vi.fn(async () => ({ close: vi.fn() }))
  const toBlob = vi.fn((cb: BlobCallback, _type?: string, _quality?: number) => cb(webp))
  const drawImage = vi.fn()
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('createImageBitmap', createImageBitmap)
    Object.assign(URL, { createObjectURL: () => 'blob:picked', revokeObjectURL })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb, type, q) {
      toBlob(cb, type, q)
    })
    createImageBitmap.mockClear()
    toBlob.mockClear()
    revokeObjectURL.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const file = (type = 'image/png') => new File(['bytes'], 'wallpaper', { type })

  it('keeps a 4K picture byte for byte', async () => {
    picture = { width: 3840, height: 2160 }
    const f = file()
    expect(await prepareWallpaper(f)).toEqual({ blob: f, resizedTo: null })
    expect(createImageBitmap).not.toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:picked')
  })

  it('scales a picture larger than 8K down, as WebP', async () => {
    picture = { width: 12000, height: 8000 }
    const { blob, resizedTo } = await prepareWallpaper(file('image/jpeg'))
    expect(blob).toBe(webp)
    expect(resizedTo).toEqual(fitWithin(12000, 8000))
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(FakeImage), {
      resizeWidth: resizedTo!.width,
      resizeHeight: resizedTo!.height,
      resizeQuality: 'high',
    })
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.92)
  })

  it('keeps an SVG as it is, even one with no size of its own', async () => {
    picture = { width: 0, height: 0 }
    const f = file('image/svg+xml')
    expect(await prepareWallpaper(f)).toEqual({ blob: f, resizedTo: null })
  })

  it('refuses a file the browser cannot show', async () => {
    picture = 'broken'
    await expect(prepareWallpaper(file('image/heic'))).rejects.toBeInstanceOf(UnreadableImageError)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:picked')
  })

  it('refuses a picture with no size', async () => {
    picture = { width: 0, height: 0 }
    await expect(prepareWallpaper(file())).rejects.toBeInstanceOf(UnreadableImageError)
  })
})
