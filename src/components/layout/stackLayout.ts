import type { WidgetId, WidgetLayout } from '@/types/widget'

/** Widgets drawn straight on the wallpaper. They read as page chrome, not cards. */
const WALLPAPER_WIDGETS = new Set<WidgetId>(['clock', 'search', 'shortcuts'])

const byReadingOrder = (a: WidgetLayout, b: WidgetLayout) => a.y - b.y || a.x - b.x

/**
 * Narrow layouts (sm / xs) are derived, never stored, so 12-column positions
 * are not reused at 8 or 4 columns. Widgets keep the desktop reading order.
 * Wallpaper widgets span the row. Cards go two to a row when there are at
 * least 8 columns, and a lone last card is centred at the same width rather
 * than stretched. Below 8 columns every card spans the row. `minRows` raises
 * a widget whose content needs more rows at this width than on a desktop,
 * such as shortcut tiles wrapping onto more lines.
 */
export function generateStackedLayout(
  visible: WidgetLayout[],
  cols: number,
  minRows: Partial<Record<WidgetId, number>> = {},
): WidgetLayout[] {
  const heightOf = (item: WidgetLayout) => Math.max(item.h, minRows[item.i] ?? 0)
  const half = Math.floor(cols / 2)
  const pairCards = cols >= 8
  const out: WidgetLayout[] = []
  let y = 0
  let cards: WidgetLayout[] = []

  const placeCards = () => {
    const step = pairCards ? 2 : 1
    for (let i = 0; i < cards.length; i += step) {
      const row = cards.slice(i, i + step)
      const h = Math.max(...row.map(heightOf))
      if (!pairCards) {
        out.push({ ...row[0], x: 0, y, w: cols, h })
      } else if (row.length === 2) {
        out.push({ ...row[0], x: 0, y, w: half, h }, { ...row[1], x: half, y, w: cols - half, h })
      } else {
        out.push({ ...row[0], x: Math.floor((cols - half) / 2), y, w: half, h })
      }
      y += h
    }
    cards = []
  }

  for (const item of [...visible].sort(byReadingOrder)) {
    if (WALLPAPER_WIDGETS.has(item.i)) {
      placeCards()
      const h = heightOf(item)
      out.push({ ...item, x: 0, y, w: cols, h })
      y += h
    } else {
      cards.push(item)
    }
  }
  placeCards()
  return out
}

/**
 * Pack the widgets that share the last row side by side and centre them, so
 * one or two cards never hug the left edge. Only for layouts the user has not
 * arranged themselves; a full row is left as it is.
 */
export function centerLastRow(items: WidgetLayout[], cols = 12): WidgetLayout[] {
  if (items.length === 0) return items
  const lastY = Math.max(...items.map((item) => item.y))
  const row = items.filter((item) => item.y === lastY).sort(byReadingOrder)
  const width = row.reduce((sum, item) => sum + item.w, 0)
  if (width >= cols) return items

  const placed = new Map<WidgetId, number>()
  let x = Math.floor((cols - width) / 2)
  for (const item of row) {
    placed.set(item.i, x)
    x += item.w
  }
  return items.map((item) => {
    const nextX = placed.get(item.i)
    return nextX === undefined || nextX === item.x ? item : { ...item, x: nextX }
  })
}

const SHORTCUT_TILE_PX = 76 // 4.75rem tile column in globals.css (.shortcut-grid)
const SHORTCUT_GAP_PX = 12 // 0.75rem column gap in globals.css (.shortcut-grid)

/** How many shortcut tiles fit on one row of a `widgetCols`-wide desktop widget. */
export function shortcutColumnsForWidth(
  containerWidth: number,
  widgetCols: number,
  totalCols = 12,
  marginX = 22,
): number {
  if (containerWidth <= 0 || widgetCols <= 0 || totalCols <= 0) return 0
  const colW = (containerWidth - marginX * (totalCols - 1)) / totalCols
  const widgetW = colW * widgetCols + marginX * Math.max(0, widgetCols - 1)
  return Math.max(1, Math.floor((widgetW + SHORTCUT_GAP_PX) / (SHORTCUT_TILE_PX + SHORTCUT_GAP_PX)))
}

/**
 * Give `targetId` at least `minRows` on the desktop grid, shifting any widgets
 * placed below its old bottom edge down by the extra rows so it never spills
 * over them.
 */
export function expandWidgetRows(
  items: WidgetLayout[],
  targetId: WidgetId,
  minRows: number,
): WidgetLayout[] {
  const target = items.find((item) => item.i === targetId)
  if (!target) return items
  const nextMinH = Math.max(target.minH ?? 2, minRows)
  const nextH = Math.max(target.h, nextMinH)
  const delta = nextH - target.h
  const oldBottom = target.y + target.h

  return items.map((item) => {
    if (item.i === targetId) {
      return { ...item, h: nextH, minH: nextMinH }
    }
    if (delta > 0 && item.y >= oldBottom) {
      return { ...item, y: item.y + delta }
    }
    return item
  })
}

/** A widget where the grid shows it. */
type Placed = Pick<WidgetLayout, 'x' | 'y' | 'w' | 'h'> & { i: string }

/**
 * The layout to save once the user has dragged or resized a widget, from the
 * saved layout and the grid as shown. `before` and `after` are the widget the
 * user handled.
 *
 * Every widget is saved where it is shown, but only the one the user made
 * taller or shorter takes its height from the grid. Rows the grid added for
 * content (expandWidgetRows) are not the user's, and saving them would keep
 * a widget that tall after its content shrinks.
 */
export function layoutToSave(
  saved: WidgetLayout[],
  shown: Placed[],
  before: Placed,
  after: Placed,
): WidgetLayout[] {
  const resized = after.h !== before.h ? after.i : null
  return saved.map((cur) => {
    const next = shown.find((n) => n.i === cur.i)
    if (!next) return cur
    const h = cur.i === resized ? next.h : cur.h
    return { ...cur, x: next.x, y: next.y, w: next.w, h }
  })
}
