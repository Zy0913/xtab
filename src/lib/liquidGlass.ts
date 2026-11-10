/**
 * Liquid Glass edge refraction.
 *
 * macOS 27 glass bends the picture behind it near its edges, the way a thick
 * pane with rounded edges would. Chrome can run an SVG filter inside
 * `backdrop-filter`, so each glass surface on the wallpaper gets a
 * displacement map drawn for its size and corner radius, and globals.css picks
 * it up through `--lens`. Surfaces of the same size share one filter, so all
 * the shortcut tiles cost a single map.
 *
 * The map only refracts. How frosted the glass is stays in CSS.
 */

const SVG_NS = 'http://www.w3.org/2000/svg'
const SURFACES = '.on-wallpaper .material, .on-wallpaper .tile'
/** A surface that keeps changing size (a widget being resized) shows plain
 *  glass, and gets a new map once it has held still this long. */
const SETTLE_MS = 160

export interface Lens {
  /** Corner radius the map is drawn for, px. */
  radius: number
  /** Width of the refracting rim, px. */
  band: number
  /** How far inward the outermost pixel looks, px. Below band / 2 the picture
   *  never folds back on itself. */
  depth: number
}

/** Rim geometry for a surface: about as wide as its corners are round. */
export function lensFor(width: number, height: number, radius: number): Lens {
  const half = Math.max(0, Math.min(width, height) / 2)
  const r = Math.min(Math.max(Number.isFinite(radius) ? radius : 0, 0), half)
  const band = Math.min(Math.max(r * 0.9, 6), 24, half)
  return { radius: r, band, depth: band * 0.42 }
}

/**
 * RGBA displacement map for feDisplacementMap with a scale of 2 × depth: red
 * moves the sample along x, green along y; 128 leaves it in place and 0 / 255
 * move it by -depth / +depth. Inside the rim every pixel looks inward along
 * the edge normal, the most at the outer edge, easing to nothing at the inner
 * one, which magnifies the picture towards the edge like a convex lens.
 */
export function lensMap(width: number, height: number, lens: Lens): Uint8ClampedArray<ArrayBuffer> {
  const w = Math.max(0, Math.round(width))
  const h = Math.max(0, Math.round(height))
  const data = new Uint8ClampedArray(w * h * 4).fill(128)
  for (let i = 3; i < data.length; i += 4) data[i] = 255
  const { band, depth } = lens
  if (band <= 0 || depth <= 0) return data

  const hw = w / 2
  const hh = h / 2
  // Measure against a corner at least as round as the rim is wide, so the rim
  // turns the corner smoothly.
  const r = Math.min(Math.max(lens.radius, band), hw, hh)
  const k = 255 / (2 * depth)

  const shade = (x: number, y: number) => {
    const px = x + 0.5 - hw
    const py = y + 0.5 - hh
    // Rounded-rectangle distance field, folded into one quadrant.
    const qx = Math.abs(px) - (hw - r)
    const qy = Math.abs(py) - (hh - r)
    let dist: number
    let nx = 0
    let ny = 0
    if (qx > 0 && qy > 0) {
      const l = Math.hypot(qx, qy)
      dist = r - l
      nx = qx / l
      ny = qy / l
    } else if (qx > qy) {
      dist = r - qx
      nx = 1
    } else {
      dist = r - qy
      ny = 1
    }
    if (dist >= band) return
    const t = 1 - Math.max(0, dist) / band
    const m = depth * t * t * k
    const i = (y * w + x) * 4
    data[i] = 128 - Math.sign(px) * nx * m
    data[i + 1] = 128 - Math.sign(py) * ny * m
  }

  // Rows clear of the top and bottom edges only have rim at their two ends.
  const capRows = Math.ceil(Math.max(r, band))
  const sideCols = Math.min(w, Math.ceil(band))
  for (let y = 0; y < h; y++) {
    if (y < capRows || y >= h - capRows) {
      for (let x = 0; x < w; x++) shade(x, y)
    } else {
      for (let x = 0; x < sideCols; x++) shade(x, y)
      for (let x = Math.max(sideCols, w - sideCols); x < w; x++) shade(x, y)
    }
  }
  return data
}

// ───────────────────────────── Live surfaces ─────────────────────────────

interface Filter {
  id: string
  refs: number
  node: SVGFilterElement
}

let active = false
let defs: SVGSVGElement | null = null
let resizes: ResizeObserver | null = null
let mutations: MutationObserver | null = null
let scanFrame = 0
let nextId = 0
const filters = new Map<string, Filter>()
/** Every glass surface being watched, and the filter it uses (null: none). */
const surfaces = new Map<HTMLElement, string | null>()
const settling = new Map<HTMLElement, ReturnType<typeof setTimeout>>()

/**
 * Turn edge refraction on (Liquid Glass) or off. A no-op where the browser
 * lacks what it needs, which leaves plain frosted glass.
 */
export function setLensing(on: boolean): void {
  if (on === active) return
  if (on && !canLens()) return
  active = on
  if (on) start()
  else stop()
}

function canLens(): boolean {
  return (
    typeof ResizeObserver === 'function' &&
    typeof MutationObserver === 'function' &&
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('backdrop-filter', 'url(#lens)')
  )
}

function start() {
  resizes = new ResizeObserver(onResize)
  mutations = new MutationObserver(onMutation)
  mutations.observe(document.getElementById('root') ?? document.body, {
    childList: true,
    subtree: true,
  })
  scan()
}

function stop() {
  mutations?.disconnect()
  resizes?.disconnect()
  mutations = null
  resizes = null
  if (scanFrame) cancelAnimationFrame(scanFrame)
  scanFrame = 0
  for (const timer of settling.values()) clearTimeout(timer)
  settling.clear()
  for (const el of surfaces.keys()) el.style.removeProperty('--lens')
  surfaces.clear()
  filters.clear()
  defs?.remove()
  defs = null
}

/** Text updates (the clock ticking) add no elements and cost nothing. */
function onMutation(records: MutationRecord[]) {
  for (const record of records) {
    for (const node of [...record.addedNodes, ...record.removedNodes]) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        queueScan()
        return
      }
    }
  }
}

function queueScan() {
  if (scanFrame) return
  scanFrame = requestAnimationFrame(() => {
    scanFrame = 0
    scan()
  })
}

/** Start watching new glass surfaces and forget the ones that went away. */
function scan() {
  if (!resizes) return
  const found = new Set(document.querySelectorAll<HTMLElement>(SURFACES))
  for (const el of found) {
    if (surfaces.has(el)) continue
    surfaces.set(el, null)
    resizes.observe(el, { box: 'border-box' })
  }
  for (const el of surfaces.keys()) {
    if (!found.has(el)) forget(el)
  }
}

function forget(el: HTMLElement) {
  resizes?.unobserve(el)
  clearSettle(el)
  detach(el)
  surfaces.delete(el)
}

function onResize(entries: ResizeObserverEntry[]) {
  for (const entry of entries) {
    const el = entry.target as HTMLElement
    if (!surfaces.has(el)) continue
    const box = entry.borderBoxSize?.[0]
    const width = Math.round(box ? box.inlineSize : entry.contentRect.width)
    const height = Math.round(box ? box.blockSize : entry.contentRect.height)
    const resizing = settling.has(el)
    clearSettle(el)
    if (surfaces.get(el) === null && !resizing) {
      attach(el, width, height)
    } else {
      // The map no longer fits; plain glass until the size settles.
      detach(el)
      settling.set(
        el,
        setTimeout(() => {
          settling.delete(el)
          attach(el, width, height)
        }, SETTLE_MS),
      )
    }
  }
}

function clearSettle(el: HTMLElement) {
  const timer = settling.get(el)
  if (timer === undefined) return
  clearTimeout(timer)
  settling.delete(el)
}

function attach(el: HTMLElement, width: number, height: number) {
  if (!surfaces.has(el) || width < 4 || height < 4) return
  const lens = lensFor(width, height, cornerRadius(el, width, height))
  const key = `${width}x${height}@${lens.radius.toFixed(1)}`
  if (surfaces.get(el) === key) return
  detach(el)
  let filter = filters.get(key)
  if (!filter) {
    const node = createFilter(width, height, lens)
    if (!node) return
    filter = { id: node.id, refs: 0, node }
    filters.set(key, filter)
  }
  filter.refs += 1
  surfaces.set(el, key)
  el.style.setProperty('--lens', `url(#${filter.id})`)
}

function detach(el: HTMLElement) {
  const key = surfaces.get(el)
  if (!key) return
  surfaces.set(el, null)
  el.style.removeProperty('--lens')
  const filter = filters.get(key)
  if (filter && --filter.refs <= 0) {
    filter.node.remove()
    filters.delete(key)
  }
}

function cornerRadius(el: HTMLElement, width: number, height: number): number {
  const value = getComputedStyle(el).borderTopLeftRadius
  const n = parseFloat(value)
  if (!Number.isFinite(n)) return 0
  return value.trim().endsWith('%') ? (n / 100) * Math.min(width, height) : n
}

function createFilter(width: number, height: number, lens: Lens): SVGFilterElement | null {
  const href = mapUrl(width, height, lens)
  if (!href) return null
  nextId += 1
  const filter = svg('filter', {
    id: `liquid-glass-${nextId}`,
    x: 0,
    y: 0,
    width,
    height,
    filterUnits: 'userSpaceOnUse',
    'color-interpolation-filters': 'sRGB',
  })
  filter.append(
    // An undecoded image reads as transparent black, which would shift the
    // whole backdrop by -depth; laying it over neutral grey keeps the glass
    // still until the map arrives.
    svg('feFlood', { 'flood-color': '#808080', result: 'neutral' }),
    svg('feImage', {
      href,
      x: 0,
      y: 0,
      width,
      height,
      preserveAspectRatio: 'none',
      result: 'image',
    }),
    svg('feComposite', { in: 'image', in2: 'neutral', operator: 'over', result: 'map' }),
    svg('feDisplacementMap', {
      in: 'SourceGraphic',
      in2: 'map',
      scale: 2 * lens.depth,
      xChannelSelector: 'R',
      yChannelSelector: 'G',
    }),
  )
  defsRoot().append(filter)
  return filter
}

function mapUrl(width: number, height: number, lens: Lens): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.putImageData(new ImageData(lensMap(width, height, lens), width, height), 0, 0)
  return canvas.toDataURL()
}

function defsRoot(): SVGSVGElement {
  if (defs?.isConnected) return defs
  defs = svg('svg', { width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' })
  defs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
  // globals.css hides anything else placed straight under <body>.
  ;(document.getElementById('portal-root') ?? document.body).append(defs)
  return defs
}

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value))
  return el
}
