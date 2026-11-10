import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Responsive, type ItemCallback } from 'react-grid-layout'
import type { WidgetLayout } from '@/types/widget'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const BREAKPOINTS = { lg: 1200, md: 900, sm: 640, xs: 0 }
const COLS = { lg: 12, md: 12, sm: 8, xs: 4 }
const MARGIN: [number, number] = [22, 18]
const NO_PADDING: [number, number] = [0, 0]
const RESIZE_HANDLES: Array<'se'> = ['se']

export type Breakpoint = keyof typeof BREAKPOINTS

/** Same rule as react-grid-layout: the widest breakpoint the width exceeds. */
function breakpointFor(width: number): Breakpoint {
  if (width > BREAKPOINTS.lg) return 'lg'
  if (width > BREAKPOINTS.md) return 'md'
  if (width > BREAKPOINTS.sm) return 'sm'
  return 'xs'
}

interface Props {
  visible: WidgetLayout[]
  smLayout: WidgetLayout[]
  xsLayout: WidgetLayout[]
  editMode: boolean
  /** Called when a drag or resize ends; narrow layouts are never editable. */
  onLayoutCommit: ItemCallback
  onBreakpointChange: (breakpoint: Breakpoint) => void
  children: ReactNode
}

export function GridLayer({
  visible,
  smLayout,
  xsLayout,
  editMode,
  onLayoutCommit,
  onBreakpointChange,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  // Measure before the grid mounts so widgets render in place on the first
  // frame, instead of sliding over from react-grid-layout's 1280px default.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const measured = width > 0
  const breakpoint = breakpointFor(width)
  useLayoutEffect(() => {
    if (measured) onBreakpointChange(breakpoint)
  }, [measured, breakpoint, onBreakpointChange])

  const layouts = useMemo(
    () => ({ lg: visible, md: visible, sm: smLayout, xs: xsLayout }),
    [visible, smLayout, xsLayout],
  )
  const editable = editMode && (breakpoint === 'lg' || breakpoint === 'md')

  return (
    <div ref={ref}>
      {measured && (
        <Responsive
          width={width}
          className={editMode ? 'is-editing' : undefined}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={68}
          margin={MARGIN}
          containerPadding={NO_PADDING}
          layouts={layouts}
          isDraggable={editable}
          isResizable={editable}
          resizeHandles={RESIZE_HANDLES}
          draggableHandle=".widget-drag-handle"
          draggableCancel=".widget-remove"
          compactType="vertical"
          onDragStop={onLayoutCommit}
          onResizeStop={onLayoutCommit}
        >
          {children}
        </Responsive>
      )}
    </div>
  )
}
