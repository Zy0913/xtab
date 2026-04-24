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

export const WIDGET_LABELS: Record<WidgetId, string> = {
  search: '搜索',
  clock: '时钟',
  shortcuts: '快捷方式',
  weather: '天气',
  todo: '待办',
  bookmarks: '书签',
}

export interface WidgetLayout {
  i: WidgetId
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}
