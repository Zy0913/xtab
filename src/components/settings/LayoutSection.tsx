import { RotateCcw, Download, Upload } from 'lucide-react'
import { useLayoutStore } from '@/store/useLayoutStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { useTodoStore } from '@/store/useTodoStore'
import { cn } from '@/lib/cn'
import type { WidgetId, WidgetLayout, Shortcut } from '@/types/widget'
import type { TodoItem } from '@/store/useTodoStore'

const WIDGET_LABELS: Record<WidgetId, string> = {
  search: '搜索',
  clock: '时钟',
  shortcuts: '快捷方式',
  weather: '天气',
  todo: '待办',
  bookmarks: '书签',
}

const ALL_IDS = Object.keys(WIDGET_LABELS) as WidgetId[]
const VALID_THEMES = ['light', 'dark', 'system'] as const
const VALID_ENGINES = ['google', 'bing', 'baidu', 'duckduckgo'] as const
const VALID_GLASS = ['sequoia', 'tahoe'] as const

function isStr(v: unknown): v is string { return typeof v === 'string' }
function isNum(v: unknown): v is number { return typeof v === 'number' && isFinite(v) }
function isBool(v: unknown): v is boolean { return typeof v === 'boolean' }
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseLayouts(raw: unknown): WidgetLayout[] {
  if (!Array.isArray(raw)) throw new Error('layouts 格式错误')
  for (const item of raw) {
    if (!isObj(item) || !ALL_IDS.includes(item.i as WidgetId))
      throw new Error(`非法 widget id: ${String(item?.i)}`)
    if (!isNum(item.x) || !isNum(item.y) || !isNum(item.w) || !isNum(item.h))
      throw new Error('layouts 坐标格式错误')
  }
  return raw as WidgetLayout[]
}

function parseEnabled(raw: unknown): WidgetId[] {
  if (!Array.isArray(raw)) throw new Error('enabled 格式错误')
  for (const id of raw)
    if (!ALL_IDS.includes(id as WidgetId)) throw new Error(`非法 widget id: ${String(id)}`)
  return raw as WidgetId[]
}

function parseSettings(raw: unknown) {
  if (!isObj(raw)) throw new Error('settings 格式错误')
  const { theme, glassMode, searchEngine, wallpaper, wallpaperTint, reduceMotion } = raw
  if (theme !== undefined && !VALID_THEMES.includes(theme as typeof VALID_THEMES[number]))
    throw new Error(`非法 theme: ${String(theme)}`)
  if (glassMode !== undefined && !VALID_GLASS.includes(glassMode as typeof VALID_GLASS[number]))
    throw new Error(`非法 glassMode: ${String(glassMode)}`)
  if (searchEngine !== undefined && !VALID_ENGINES.includes(searchEngine as typeof VALID_ENGINES[number]))
    throw new Error(`非法 searchEngine: ${String(searchEngine)}`)
  if (wallpaper !== undefined && !isStr(wallpaper))
    throw new Error('wallpaper 格式错误')
  if (wallpaperTint !== undefined && !isStr(wallpaperTint) && wallpaperTint !== null)
    throw new Error('wallpaperTint 格式错误')
  if (reduceMotion !== undefined && !isBool(reduceMotion))
    throw new Error('reduceMotion 格式错误')
  return { theme, glassMode, searchEngine, wallpaper, wallpaperTint, reduceMotion } as {
    theme?: typeof VALID_THEMES[number]
    glassMode?: typeof VALID_GLASS[number]
    searchEngine?: typeof VALID_ENGINES[number]
    wallpaper?: string
    wallpaperTint?: string | null
    reduceMotion?: boolean
  }
}

function parseShortcuts(raw: unknown): Shortcut[] {
  if (!Array.isArray(raw)) throw new Error('shortcuts 格式错误')
  for (const item of raw) {
    if (!isObj(item) || !isStr(item.id) || !isStr(item.title) || !isStr(item.url))
      throw new Error('shortcuts 条目格式错误')
  }
  return raw as Shortcut[]
}

function parseTodos(raw: unknown): TodoItem[] {
  if (!Array.isArray(raw)) throw new Error('todos 格式错误')
  for (const item of raw) {
    if (!isObj(item) || !isStr(item.id) || !isStr(item.text) || !isBool(item.done) || !isNum(item.createdAt))
      throw new Error('todos 条目格式错误')
  }
  return raw as TodoItem[]
}

export function LayoutSection() {
  const enabled = useLayoutStore((s) => s.enabled)
  const toggleWidget = useLayoutStore((s) => s.toggleWidget)
  const resetLayout = useLayoutStore((s) => s.reset)

  const handleExport = () => {
    const { theme, glassMode, searchEngine, wallpaper, wallpaperTint, reduceMotion } = useSettingsStore.getState()
    const data = {
      version: 2,
      layouts: useLayoutStore.getState().layouts,
      enabled: useLayoutStore.getState().enabled,
      settings: { theme, glassMode, searchEngine, wallpaper, wallpaperTint, reduceMotion },
      shortcuts: useShortcutsStore.getState().items,
      todos: useTodoStore.getState().items,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tab-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const raw = JSON.parse(await file.text())
      if (!isObj(raw)) throw new Error('文件不是合法 JSON 对象')

      if (raw.layouts !== undefined) useLayoutStore.setState({ layouts: parseLayouts(raw.layouts) })
      if (raw.enabled !== undefined) useLayoutStore.setState({ enabled: parseEnabled(raw.enabled) })
      if (raw.settings !== undefined) {
        const parsed = parseSettings(raw.settings)
        useSettingsStore.setState(parsed)
      }
      if (raw.shortcuts !== undefined) useShortcutsStore.setState({ items: parseShortcuts(raw.shortcuts) })
      if (raw.todos !== undefined) useTodoStore.setState({ items: parseTodos(raw.todos) })
    } catch (err) {
      alert(`导入失败：${err instanceof Error ? err.message : '文件格式不正确'}`)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
        组件
      </h3>

      <div className="space-y-1 rounded-card bg-surface p-2">
        {ALL_IDS.map((id) => {
          const on = enabled.includes(id)
          return (
            <label
              key={id}
              className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-surface-strong"
            >
              <span className="text-text-primary">{WIDGET_LABELS[id]}</span>
              <button
                type="button"
                onClick={() => toggleWidget(id)}
                className={cn(
                  'relative h-5 w-9 rounded-full transition',
                  on ? 'bg-accent' : 'bg-text-tertiary/40',
                )}
                aria-pressed={on}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
                    on ? 'left-[18px]' : 'left-0.5',
                  )}
                />
              </button>
            </label>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2">
        <button
          onClick={resetLayout}
          className="flex items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong"
        >
          <RotateCcw size={12} /> 重置
        </button>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong"
        >
          <Download size={12} /> 导出
        </button>
        <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-btn bg-surface py-2 text-xs text-text-primary hover:bg-surface-strong">
          <Upload size={12} /> 导入
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
      </div>
    </section>
  )
}
