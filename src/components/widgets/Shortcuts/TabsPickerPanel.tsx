import { memo, useMemo, useState } from 'react'
import { Search, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { normalizeUrlKey, type OpenTab } from './useOpenTabs'
import { getFaviconSources, getInitial, getColorFor } from './faviconFetcher'
import { useTabsPicker } from './useTabsPicker'

interface Props {
  active: boolean
  onClose: () => void
}

export function TabsPickerPanel({ active, onClose }: Props) {
  const {
    tabs,
    error,
    refresh,
    query,
    setQuery,
    groups,
    existingKeys,
    selected,
    toggle,
    toggleAll,
    allSelected,
    selectableKeys,
    totalSelected,
    handleSubmit,
  } = useTabsPicker({ active, onClose })

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center text-body text-text-secondary">
        <p>{error}</p>
        <Button size="sm" onClick={refresh}>
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题或网址"
          aria-label="搜索标签页"
          className="pl-8 glass:rounded-full"
          autoFocus
        />
      </div>

      <div className="flex h-5 items-center justify-between px-0.5 text-caption">
        <button
          type="button"
          onClick={toggleAll}
          disabled={selectableKeys.length === 0}
          className="font-medium text-accent transition-colors hover:text-accent-hover disabled:cursor-default disabled:opacity-40"
        >
          {allSelected ? '取消全选' : `全选可添加的 ${selectableKeys.length} 项`}
        </button>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1 text-text-secondary transition-colors hover:text-text-primary"
        >
          <RefreshCw size={12} aria-hidden />
          刷新
        </button>
      </div>

      <div className="form-group max-h-[320px] overflow-y-auto overscroll-contain">
        {tabs.length === 0 ? (
          <p className="py-10 text-center text-body text-text-secondary">没有可添加的标签页</p>
        ) : groups.length === 0 ? (
          <p className="py-10 text-center text-body text-text-secondary">没有匹配的标签页</p>
        ) : (
          groups.map((g) => (
            <div
              key={g.windowId}
              role="group"
              aria-label={g.isCurrent ? '当前窗口' : `窗口 ${g.windowId}`}
            >
              {/* Sticky header in the dialog's own material, blurring rows scrolling under it. */}
              <div className="sticky top-0 z-10 flex items-center justify-between bg-[rgb(var(--mat-rgb)/0.82)] px-3 py-1.5 text-caption font-semibold text-text-secondary backdrop-blur-md">
                <span>{g.isCurrent ? '当前窗口' : `窗口 ${g.windowId}`}</span>
                <span className="font-normal tabular-nums">{g.tabs.length}</span>
              </div>
              <ul className="px-1 pb-1">
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

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button onClick={onClose}>取消</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={totalSelected === 0}>
          {totalSelected > 0 ? `添加 ${totalSelected} 项` : '添加'}
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

const TabRow = memo(function TabRow({ tab, existing, checked, onToggle }: TabRowProps) {
  const host = (() => {
    try {
      return new URL(tab.url).hostname
    } catch {
      return tab.url
    }
  })()
  const on = checked || existing

  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        disabled={existing}
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-[6px] px-2 py-1.5 text-left transition-colors duration-fast',
          existing ? 'cursor-default' : 'hover:bg-fill active:bg-fill-strong',
        )}
      >
        {/* NSButton checkbox */}
        <span
          aria-hidden
          className={cn(
            'flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] transition-colors duration-fast',
            on
              ? 'bg-accent text-on-accent'
              : 'bg-control shadow-[inset_0_0_0_0.5px_var(--control-border),0_0.5px_1px_rgb(0_0_0/0.1)]',
            existing && 'opacity-50',
          )}
        >
          {on && <Check size={10} strokeWidth={3.5} />}
        </span>
        <TabFavicon key={`${tab.id}-${tab.url}-${tab.favIconUrl || ''}`} tab={tab} />
        <span className={cn('flex min-w-0 flex-1 flex-col', existing && 'opacity-50')}>
          <span className="truncate text-body text-text-primary">{tab.title}</span>
          <span className="truncate text-caption text-text-secondary">{host}</span>
        </span>
        {existing && <span className="shrink-0 text-caption text-text-secondary">已添加</span>}
      </button>
    </li>
  )
})

function TabFavicon({ tab }: { tab: OpenTab }) {
  const [sourceIndex, setSourceIndex] = useState(0)

  const sources = useMemo(() => {
    const list: string[] = []
    // Prioritize data URIs (e.g. dev server dynamic favicons)
    if (tab.favIconUrl?.startsWith('data:')) {
      list.push(tab.favIconUrl)
    }
    // Add extension favicon API (bypasses CORP/CORS) and public API fallbacks
    list.push(...getFaviconSources(tab.url))
    // Add original HTTP URL favicon as a last resort
    if (tab.favIconUrl && !tab.favIconUrl.startsWith('data:')) {
      list.push(tab.favIconUrl)
    }
    return list
  }, [tab.favIconUrl, tab.url])

  if (sourceIndex < sources.length) {
    return (
      <img
        src={sources[sourceIndex]}
        alt=""
        width={16}
        height={16}
        referrerPolicy="no-referrer"
        className="h-4 w-4 shrink-0 object-contain"
        onError={() => setSourceIndex((i) => i + 1)}
      />
    )
  }
  return (
    <span
      aria-hidden
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-semibold text-white"
      style={{ backgroundColor: getColorFor(tab.title) }}
    >
      {getInitial(tab.title)}
    </span>
  )
}
