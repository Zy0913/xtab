import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import type { ItemCallback } from 'react-grid-layout'
import { Minus } from 'lucide-react'
import { useLayoutStore } from '@/store/useLayoutStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { WidgetFrame } from './WidgetFrame'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { SearchBar } from '@/components/widgets/SearchBar/SearchBar'
import { Clock } from '@/components/widgets/Clock/Clock'
import { ShortcutsGrid } from '@/components/widgets/Shortcuts/ShortcutsGrid'
import { WeatherWidget } from '@/components/widgets/Weather/Weather'
import { TodoList } from '@/components/widgets/Todo/TodoList'
import { BookmarksTree } from '@/components/widgets/Bookmarks/BookmarksTree'
import { WIDGET_LABELS, type WidgetId } from '@/types/widget'
import { centerLastRow, generateStackedLayout } from './stackLayout'
import type { Breakpoint } from './GridLayer'
import './DashboardGrid.css'

// Defer react-grid-layout (+ its CSS) until the first render so it doesn't
// inflate the first-paint bundle. The chunk is still fetched immediately
// after paint, so editMode entry feels instant.
const GridLayer = lazy(() => import('./GridLayer').then((m) => ({ default: m.GridLayer })))

const WIDGETS: Record<
  WidgetId,
  { title: string; render: () => JSX.Element; transparent?: boolean }
> = {
  search: { title: WIDGET_LABELS.search, render: () => <SearchBar />, transparent: true },
  clock: { title: WIDGET_LABELS.clock, render: () => <Clock />, transparent: true },
  shortcuts: { title: WIDGET_LABELS.shortcuts, render: () => <ShortcutsGrid />, transparent: true },
  weather: { title: WIDGET_LABELS.weather, render: () => <WeatherWidget /> },
  todo: { title: WIDGET_LABELS.todo, render: () => <TodoList /> },
  bookmarks: { title: WIDGET_LABELS.bookmarks, render: () => <BookmarksTree /> },
}

/** Columns of the stacked layouts, as in GridLayer's COLS. */
const STACK_COLS = { sm: 8, xs: 4 } as const

export function DashboardGrid() {
  const layouts = useLayoutStore((s) => s.layouts)
  const enabled = useLayoutStore((s) => s.enabled)
  const customized = useLayoutStore((s) => s.customized)
  const setLayouts = useLayoutStore((s) => s.setLayouts)
  const toggleWidget = useLayoutStore((s) => s.toggleWidget)
  const editMode = useSettingsStore((s) => s.editMode)
  const toggleEditMode = useSettingsStore((s) => s.toggleEditMode)
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg')
  const stackCols = breakpoint === 'sm' || breakpoint === 'xs' ? STACK_COLS[breakpoint] : null
  const narrow = stackCols !== null
  // The add tile counts too.
  const shortcutTiles = useShortcutsStore((s) => s.items.length) + 1

  const visible = useMemo(() => {
    const items = layouts
      .filter((l) => enabled.includes(l.i))
      .map((l) => {
        if (l.i === 'search') return { ...l, minH: 1 }
        if (l.i === 'shortcuts') return { ...l, minH: 2 }
        return l
      })
    return customized ? items : centerLastRow(items)
  }, [layouts, enabled, customized])

  // Stacked, the shortcuts put one tile in each grid column (see
  // --shortcut-columns below) and get a grid row for each row of tiles: a row
  // of tiles is 80px tall, a grid row 86px with its margin.
  const smLayout = useMemo(
    () =>
      generateStackedLayout(visible, STACK_COLS.sm, {
        shortcuts: Math.ceil(shortcutTiles / STACK_COLS.sm),
      }),
    [visible, shortcutTiles],
  )
  const xsLayout = useMemo(
    () =>
      generateStackedLayout(visible, STACK_COLS.xs, {
        shortcuts: Math.ceil(shortcutTiles / STACK_COLS.xs),
      }),
    [visible, shortcutTiles],
  )
  // Never more columns than tiles, so a short row stays centred.
  const stackStyle = narrow
    ? ({ '--shortcut-columns': Math.min(stackCols, shortcutTiles) } as CSSProperties)
    : undefined

  // Save only what the user arranged. Saving every layout change would also
  // store vertical compaction and the centred row as if they were choices.
  const commitLayout: ItemCallback = (current, before, after) => {
    const moved =
      before.x !== after.x || before.y !== after.y || before.w !== after.w || before.h !== after.h
    if (!moved) return
    setLayouts(
      layouts.map((cur) => {
        const next = current.find((n) => n.i === cur.i)
        return next ? { ...cur, x: next.x, y: next.y, w: next.w, h: next.h } : cur
      }),
    )
  }

  const children = visible.map((item) => {
    const widget = WIDGETS[item.i]
    return (
      <div key={item.i} data-surface={widget.transparent ? 'wallpaper' : 'material'}>
        <WidgetFrame editMode={editMode} transparent={widget.transparent}>
          <div
            className={cn('relative flex h-full w-full flex-col', !widget.transparent && 'p-4')}
            style={stackStyle}
          >
            <ErrorBoundary>{widget.render()}</ErrorBoundary>
          </div>
          {/* While editing, the whole widget is the drag surface and its
              content stays inert, as on the macOS desktop. */}
          {editMode && !narrow && (
            <div
              aria-hidden
              className="widget-drag-handle absolute inset-0 cursor-grab rounded-[inherit] active:cursor-grabbing"
            />
          )}
          {editMode && (
            <button
              type="button"
              onClick={() => toggleWidget(item.i)}
              aria-label={`移除${widget.title}`}
              title={`移除${widget.title}`}
              className="widget-remove material-pop animate-check-in absolute -left-2 -top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full text-text-primary transition-transform duration-fast hover:scale-110 active:scale-95"
            >
              <Minus size={12} strokeWidth={3} aria-hidden />
            </button>
          )}
        </WidgetFrame>
      </div>
    )
  })

  return (
    <>
      <Suspense fallback={null}>
        <GridLayer
          visible={visible}
          smLayout={smLayout}
          xsLayout={xsLayout}
          editMode={editMode}
          onLayoutCommit={commitLayout}
          onBreakpointChange={setBreakpoint}
        >
          {children}
        </GridLayer>
      </Suspense>

      {editMode && (
        <div className="material animate-rise-in fixed bottom-6 left-1/2 z-chrome flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full py-1.5 pl-4 pr-1.5 text-body text-text-secondary">
          <span>
            {narrow
              ? '窗口较窄，组件会自动排列'
              : // Shortcut tiles open their editor when clicked (ShortcutTile).
                `拖动组件调整位置，拖右下角调整大小${enabled.includes('shortcuts') ? '，点快捷方式可编辑' : ''}`}
          </span>
          <Button size="sm" variant="primary" onClick={toggleEditMode} className="rounded-full">
            完成
          </Button>
        </div>
      )}
    </>
  )
}
