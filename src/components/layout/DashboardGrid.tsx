import { lazy, Suspense, useMemo, useState } from 'react'
import type { Layout } from 'react-grid-layout'
import { useLayoutStore } from '@/store/useLayoutStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { cn } from '@/lib/cn'
import { WidgetFrame } from './WidgetFrame'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { SearchBar } from '@/components/widgets/SearchBar/SearchBar'
import { Clock } from '@/components/widgets/Clock/Clock'
import { ShortcutsGrid } from '@/components/widgets/Shortcuts/ShortcutsGrid'
import { WeatherWidget } from '@/components/widgets/Weather/Weather'
import { TodoList } from '@/components/widgets/Todo/TodoList'
import { BookmarksTree } from '@/components/widgets/Bookmarks/BookmarksTree'
import { WIDGET_LABELS, type WidgetId, type WidgetLayout } from '@/types/widget'
import './DashboardGrid.css'

// Defer react-grid-layout (+ its CSS) until the first render so it doesn't
// inflate the first-paint bundle. The chunk is still fetched immediately
// after paint, so editMode entry feels instant.
const GridLayer = lazy(() =>
  import('./GridLayer').then((m) => ({ default: m.GridLayer })),
)

const WIDGETS: Record<WidgetId, { title: string; render: () => JSX.Element; transparent?: boolean }> = {
  search: { title: WIDGET_LABELS.search, render: () => <SearchBar />, transparent: true },
  clock: { title: WIDGET_LABELS.clock, render: () => <Clock />, transparent: true },
  shortcuts: { title: WIDGET_LABELS.shortcuts, render: () => <ShortcutsGrid />, transparent: true },
  weather: { title: WIDGET_LABELS.weather, render: () => <WeatherWidget /> },
  todo: { title: WIDGET_LABELS.todo, render: () => <TodoList /> },
  bookmarks: { title: WIDGET_LABELS.bookmarks, render: () => <BookmarksTree /> },
}

function generateXsLayout(visible: WidgetLayout[]): WidgetLayout[] {
  let y = 0
  return visible.map((item) => {
    const layout = { ...item, x: 0, y, w: Math.min(item.w, 4) }
    y += item.h
    return layout
  })
}

export function DashboardGrid() {
  const layouts = useLayoutStore((s) => s.layouts)
  const enabled = useLayoutStore((s) => s.enabled)
  const setLayouts = useLayoutStore((s) => s.setLayouts)
  const editMode = useSettingsStore((s) => s.editMode)
  const [breakpoint, setBreakpoint] = useState('lg')

  const visible = useMemo(
    () => layouts.filter((l) => enabled.includes(l.i)).map((l) => {
      if (l.i === 'search') return { ...l, minH: 1 }
      if (l.i === 'shortcuts') return { ...l, minH: 2 }
      return l
    }),
    [layouts, enabled],
  )

  const xsLayout = useMemo(() => generateXsLayout(visible), [visible])

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    if (breakpoint !== 'lg' && breakpoint !== 'md') return
    const next = allLayouts[breakpoint] || currentLayout
    const merged: WidgetLayout[] = layouts.map((cur) => {
      const updated = next.find((n) => n.i === cur.i)
      if (!updated) return cur
      return {
        ...cur,
        x: updated.x,
        y: updated.y,
        w: updated.w,
        h: updated.h,
      }
    })
    setLayouts(merged)
  }

  const isMobile = breakpoint === 'xs' || breakpoint === 'sm'

  const children = visible.map((item) => {
    const w = WIDGETS[item.i]
    return (
      <div key={item.i} className={item.i === 'search' ? 'z-50' : ''}>
        <WidgetFrame editMode={editMode} transparent={w.transparent}>
          {editMode && !isMobile && (
            <div className="widget-drag-handle absolute inset-x-0 top-0 z-10 h-6 cursor-grab rounded-t-card bg-gradient-to-b from-black/[0.08] to-transparent active:cursor-grabbing" aria-label="拖拽移动" role="separator" />
          )}
          <div className={cn('relative z-[2] flex h-full w-full flex-col', !w.transparent && 'p-4')}>
            <ErrorBoundary>{w.render()}</ErrorBoundary>
          </div>
        </WidgetFrame>
      </div>
    )
  })

  return (
    <Suspense fallback={null}>
      <GridLayer
        visible={visible}
        xsLayout={xsLayout}
        editMode={editMode}
        isMobile={isMobile}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={setBreakpoint}
      >
        {children}
      </GridLayer>
    </Suspense>
  )
}
