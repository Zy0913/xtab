import { useMemo, useState } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import { useLayoutStore } from '@/store/useLayoutStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { cn } from '@/lib/cn'
import { WidgetFrame } from './WidgetFrame'
import { SearchBar } from '@/components/widgets/SearchBar/SearchBar'
import { Clock } from '@/components/widgets/Clock/Clock'
import { ShortcutsGrid } from '@/components/widgets/Shortcuts/ShortcutsGrid'
import { WeatherWidget } from '@/components/widgets/Weather/Weather'
import { TodoList } from '@/components/widgets/Todo/TodoList'
import { BookmarksTree } from '@/components/widgets/Bookmarks/BookmarksTree'
import type { WidgetId, WidgetLayout } from '@/types/widget'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './DashboardGrid.css'

const ResponsiveGrid = WidthProvider(Responsive)

const WIDGETS: Record<WidgetId, { title: string; render: () => JSX.Element; transparent?: boolean }> = {
  search: { title: '搜索', render: () => <SearchBar />, transparent: true },
  clock: { title: '时钟', render: () => <Clock />, transparent: true },
  shortcuts: { title: '快捷方式', render: () => <ShortcutsGrid />, transparent: true },
  weather: { title: '天气', render: () => <WeatherWidget /> },
  todo: { title: '待办', render: () => <TodoList /> },
  bookmarks: { title: '书签', render: () => <BookmarksTree /> },
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

  return (
    <ResponsiveGrid
      className={editMode ? 'is-editing' : ''}
      breakpoints={{ lg: 1200, md: 900, sm: 640, xs: 0 }}
      cols={{ lg: 12, md: 12, sm: 8, xs: 4 }}
      rowHeight={60}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      layouts={{ lg: visible, md: visible, sm: visible, xs: xsLayout }}
      onLayoutChange={handleLayoutChange}
      onBreakpointChange={(bp) => setBreakpoint(bp)}
      isDraggable={editMode && !isMobile}
      isResizable={editMode && !isMobile}
      resizeHandles={['se']}
      draggableHandle=".widget-drag-handle"
      compactType="vertical"
    >
      {visible.map((item) => {
        const w = WIDGETS[item.i]
        return (
          <div key={item.i} className={item.i === 'search' ? 'z-50' : ''}>
            <WidgetFrame editMode={editMode} transparent={w.transparent}>
              {editMode && !isMobile && (
                <div className="widget-drag-handle absolute inset-x-0 top-0 z-10 h-6 cursor-grab rounded-t-card bg-gradient-to-b from-black/[0.08] to-transparent active:cursor-grabbing" />
              )}
              <div className={cn('relative z-[2] flex h-full w-full flex-col', !w.transparent && 'p-4')}>
                {w.render()}
              </div>
            </WidgetFrame>
          </div>
        )
      })}
    </ResponsiveGrid>
  )
}