import { describe, it, expect, vi, afterEach } from 'vitest'
import { lensFor, lensMap, setLensing } from './liquidGlass'

/** [red, green] of one pixel: 128 = no displacement on that axis. */
function at(map: Uint8ClampedArray, width: number, x: number, y: number) {
  const i = (y * width + x) * 4
  return [map[i], map[i + 1]]
}

describe('lensFor', () => {
  it('keeps the rim inside the surface and the picture unfolded', () => {
    const shapes = [
      [52, 52, 14], // shortcut tile
      [320, 180, 22], // widget
      [480, 52, 9999], // search capsule
      [10, 10, 3],
      [200, 100, Number.NaN],
    ]
    for (const [w, h, r] of shapes) {
      const lens = lensFor(w, h, r)
      expect(lens.radius).toBeLessThanOrEqual(Math.min(w, h) / 2)
      expect(lens.band).toBeLessThanOrEqual(Math.min(w, h) / 2)
      expect(lens.band).toBeGreaterThan(0)
      expect(lens.depth).toBeLessThan(lens.band / 2)
    }
  })
})

describe('lensMap', () => {
  const w = 120
  const h = 80
  const lens = lensFor(w, h, 22)
  const map = lensMap(w, h, lens)

  it('is opaque and leaves the middle of the glass alone', () => {
    expect(map).toHaveLength(w * h * 4)
    expect(map.every((v, i) => i % 4 !== 3 || v === 255)).toBe(true)
    expect(at(map, w, w / 2, h / 2)).toEqual([128, 128])
    // Just past the rim on the left edge.
    expect(at(map, w, Math.ceil(lens.band), h / 2)).toEqual([128, 128])
  })

  it('makes the rim look inward along the edge normal', () => {
    const [leftX, leftY] = at(map, w, 0, h / 2)
    expect(leftX).toBeGreaterThan(200) // samples to the right
    expect(leftY).toBe(128)
    const [rightX] = at(map, w, w - 1, h / 2)
    expect(rightX).toBeLessThan(56) // samples to the left
    const [topX, topY] = at(map, w, w / 2, 0)
    expect(topX).toBe(128)
    expect(topY).toBeGreaterThan(200) // samples downward
  })

  it('looks diagonally inward at the corners, with no gaps', () => {
    const [x, y] = at(map, w, 0, 0)
    expect(x).toBeGreaterThan(128)
    expect(x).toBe(y)
    // A pixel inside the rounded corner, well within the rim.
    const [cx, cy] = at(map, w, 10, 10)
    expect(cx).toBeGreaterThan(128)
    expect(cy).toBeGreaterThan(128)
  })

  it('is mirror-symmetric', () => {
    let worst = 0
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const [r, g] = at(map, w, x, y)
        const [mirroredR] = at(map, w, w - 1 - x, y)
        const [, mirroredG] = at(map, w, x, h - 1 - y)
        worst = Math.max(worst, Math.abs(r + mirroredR - 256), Math.abs(g + mirroredG - 256))
      }
    }
    expect(worst).toBeLessThanOrEqual(1)
  })

  it('never folds the picture back on itself', () => {
    let previous = -Infinity
    for (let x = 0; x < w / 2; x++) {
      const [r] = at(map, w, x, h / 2)
      const sampled = x + ((r - 128) / 255) * 2 * lens.depth
      expect(sampled).toBeGreaterThan(previous)
      previous = sampled
    }
  })
})

describe('setLensing', () => {
  afterEach(() => {
    setLensing(false)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('does nothing where the browser cannot refract', () => {
    // jsdom has no ResizeObserver.
    document.body.innerHTML = '<main class="on-wallpaper"><div class="material"></div></main>'
    setLensing(true)
    expect(document.querySelector('filter')).toBeNull()
    expect(document.querySelector<HTMLElement>('.material')!.style.getPropertyValue('--lens')).toBe(
      '',
    )
  })

  it('gives same-sized surfaces one shared filter and cleans up when turned off', () => {
    document.body.innerHTML = `
      <div id="root"><main class="on-wallpaper">
        <a class="tile"></a><a class="tile"></a><div class="material"></div>
      </main></div>
      <div id="portal-root"></div>`

    class FakeResizeObserver {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        const size = target.classList.contains('tile') ? 52 : 200
        const entry = {
          target,
          borderBoxSize: [{ inlineSize: size, blockSize: size / 2 }],
          contentRect: { width: size, height: size / 2 },
        }
        this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    vi.stubGlobal('CSS', { supports: () => true })
    vi.stubGlobal(
      'ImageData',
      class {
        constructor(
          readonly data: Uint8ClampedArray,
          readonly width: number,
          readonly height: number,
        ) {}
      },
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      putImageData: () => {},
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,')

    setLensing(true)

    const [first, second] = document.querySelectorAll<HTMLElement>('.tile')
    const lens = first.style.getPropertyValue('--lens')
    expect(lens).toMatch(/^url\(#liquid-glass-\d+\)$/)
    expect(second.style.getPropertyValue('--lens')).toBe(lens)
    expect(
      document.querySelector<HTMLElement>('.material')!.style.getPropertyValue('--lens'),
    ).not.toBe(lens)
    // Defined where globals.css cannot hide it.
    expect(document.querySelectorAll('#portal-root filter')).toHaveLength(2)

    setLensing(false)
    expect(document.querySelector('filter')).toBeNull()
    expect(first.style.getPropertyValue('--lens')).toBe('')
  })
})
