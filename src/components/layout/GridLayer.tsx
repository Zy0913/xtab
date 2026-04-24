import type { ReactNode } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import type { WidgetLayout } from '@/types/widget'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGrid = WidthProvider(Responsive)

interface Props {
  visible: WidgetLayout[]
  xsLayout: WidgetLayout[]
  editMode: boolean
  isMobile: boolean
  onLayoutChange: (current: Layout[], all: { [key: string]: Layout[] }) => void
  onBreakpointChange: (bp: string) => void
  children: ReactNode
}

export function GridLayer({
  visible,
  xsLayout,
  editMode,
  isMobile,
  onLayoutChange,
  onBreakpointChange,
  children,
}: Props) {
  return (
    <ResponsiveGrid
      className={editMode ? 'is-editing' : ''}
      breakpoints={{ lg: 1200, md: 900, sm: 640, xs: 0 }}
      cols={{ lg: 12, md: 12, sm: 8, xs: 4 }}
      rowHeight={60}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      layouts={{ lg: visible, md: visible, sm: visible, xs: xsLayout }}
      onLayoutChange={onLayoutChange}
      onBreakpointChange={onBreakpointChange}
      isDraggable={editMode && !isMobile}
      isResizable={editMode && !isMobile}
      resizeHandles={['se']}
      draggableHandle=".widget-drag-handle"
      compactType="vertical"
    >
      {children}
    </ResponsiveGrid>
  )
}
