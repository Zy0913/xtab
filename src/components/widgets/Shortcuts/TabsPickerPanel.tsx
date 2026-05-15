import { useMemo, useState } from 'react'
import { Search, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/cn'
import {
  useOpenTabs,
  groupTabsByWindow,
  normalizeUrlKey,
  type OpenTab,
} from './useOpenTabs'
import { getFaviconUrl, getInitial, getColorFor } from './faviconFetcher'

interface Props {
  active: boolean
  onClose: () => void
}

export function TabsPickerPanel({ active, onClose }: Props) {
  const { tabs, error, refresh } = useOpenTabs(active)
  const add = useShortcutsStore((s) => s.add)
  const items = useShortcutsStore((s) => s.items)

  // Compare by canonical key so that `https://github.com` and `https://github.com/`
  // are treated as the same shortcut.
  const existingKeys = useMemo(
    () => new Set(items.map((it) => normalizeUrlKey(it.url))),
    [items],
  )

  const [query, setQuery] = useState('')
  // Selection is keyed by normalized URL — survives across refreshes. We
  // intentionally don't prune on tab close: if a tab reappears (e.g. browser
  // restored it), the user's prior selection is preserved.
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Live keys = tabs currently visible in the picker. We display and submit
  // based on the intersection so closed tabs don't inflate the count.
  const liveKeys = useMemo(
    () => new Set(tabs.map((t) => normalizeUrlKey(t.url))),
    [tabs],
  )
  const liveSelected = useMemo(() => {
    const out = new Set<string>()
    for (const k of selected) if (liveKeys.has(k)) out.add(k)
    return out
  }, [selected, liveKeys])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tabs
    return tabs.filter(
      (t) => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q),
    )
  }, [tabs, query])

  const groups = useMemo(() => groupTabsByWindow(filtered), [filtered])

  const selectableKeys = useMemo(
    () =>
      filtered
        .map((t) => normalizeUrlKey(t.url))
        .filter((k) => !existingKeys.has(k)),
    [filtered, existingKeys],
  )
  const allSelected =
    selectableKeys.length > 0 && selectableKeys.every((k) => selected.has(k))

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev)
        selectableKeys.forEach((k) => next.delete(k))
        return next
      }
      return new Set([...prev, ...selectableKeys])
    })
  }

  const handleSubmit = () => {
    const tabByKey = new Map(tabs.map((t) => [normalizeUrlKey(t.url), t]))
    let added = 0
    for (const key of liveSelected) {
      if (existingKeys.has(key)) continue
      const t = tabByKey.get(key)
      if (!t) continue
      // Mirror the manual flow — store title + url only and let ShortcutTile
      // resolve the favicon at render time so we don't bake stale icon URLs in.
      add({ title: t.title, url: t.url })
      added++
    }
    if (added === 0) {
      showToast('未选择任何新标签页', 'info')
      return
    }
    showToast(`已添加 ${added} 个快捷方式`)
    setSelected(new Set())
    onClose()
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-sm text-text-secondary">
        <p>{error}</p>
        <Button size="sm" variant="secondary" onClick={refresh}>
          重试
        </Button>
      </div>
    )
  }

  const totalSelected = liveSelected.size

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题或网址"
          className="pl-8"
          autoFocus
        />
      </div>

      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <button
          type="button"
          onClick={toggleAll}
          disabled={selectableKeys.length === 0}
          className="text-accent transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {allSelected ? '取消全选' : `全选可添加 (${selectableKeys.length})`}
        </button>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1 transition hover:text-text-secondary"
          aria-label="刷新"
        >
          <RefreshCw size={12} />
          刷新
        </button>
      </div>

      <div className="max-h-[320px] overflow-y-auto rounded-btn border border-border bg-surface/40">
        {tabs.length === 0 ? (
          <p className="py-8 text-center text-xs text-text-tertiary">没有可添加的标签页</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-text-tertiary">没有匹配的标签页</p>
        ) : (
          groups.map((g) => (
            <div key={g.windowId}>
              <div className="sticky top-0 z-10 border-b border-border bg-surface-strong px-3 py-1.5 text-[11px] font-semibold text-text-primary backdrop-blur-glass">
                {g.isCurrent ? '当前窗口' : `窗口 ${g.windowId}`} · {g.tabs.length}
              </div>
              <ul>
                {g.tabs.map((t) => {
                  const key = normalizeUrlKey(t.url)
                  return (
                    <TabRow
                      key={`${t.windowId}-${t.id}`}
                      tab={t}
                      existing={existingKeys.has(key)}
                      checked={selected.has(key)}
                      onToggle={() => toggle(key)}
                    />
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={totalSelected === 0}>
          添加{totalSelected > 0 ? ` ${totalSelected} 项` : ''}
        </Button>
      </div>
    </div>
  )
}

interface TabRowProps {
  tab: OpenTab
  existing: boolean
  checked: boolean
  onToggle: () => void
}

function TabRow({ tab, existing, checked, onToggle }: TabRowProps) {
  const host = (() => {
    try {
      return new URL(tab.url).hostname
    } catch {
      return tab.url
    }
  })()

  return (
    <li>
      <button
        type="button"
        disabled={existing}
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-2.5 px-3 py-2 text-left transition',
          existing
            ? 'cursor-not-allowed opacity-50'
            : 'hover:bg-surface',
          checked && !existing && 'bg-accent/10',
        )}
      >
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
            checked || existing
              ? 'border-accent bg-accent text-white'
              : 'border-border bg-surface',
          )}
          aria-hidden
        >
          {(checked || existing) && <Check size={11} strokeWidth={3} />}
        </span>
        <TabFavicon tab={tab} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm text-text-primary">{tab.title}</span>
          <span className="truncate text-[11px] text-text-tertiary">{host}</span>
        </span>
        {existing && (
          <span className="shrink-0 text-[10px] text-text-tertiary">已添加</span>
        )}
      </button>
    </li>
  )
}

function TabFavicon({ tab }: { tab: OpenTab }) {
  const [failed, setFailed] = useState(false)
  const src = tab.favIconUrl || getFaviconUrl(tab.url)
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        width={16}
        height={16}
        className="h-4 w-4 shrink-0 object-contain"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white"
      style={{ backgroundColor: getColorFor(tab.title) }}
    >
      {getInitial(tab.title)}
    </span>
  )
}
