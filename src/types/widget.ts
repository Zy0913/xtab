export interface Shortcut {
  id: string
  title: string
  url: string
  iconUrl?: string
}

export type WidgetId =
  | 'search'
  | 'clock'
  | 'shortcuts'
  | 'weather'
  | 'todo'
  | 'bookmarks'

export interface WidgetLayout {
  i: WidgetId
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}
