import { useMemo, useState } from 'react'
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
      <div className="flex flex-col items-center gap-3 py-6 text-sm text-text-secondary">
        <p>{error}</p>
        <Button size="sm" variant="secondary" onClick={refresh}>
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

      <div className="bg-surface/40 max-h-[320px] overflow-y-auto rounded-btn border border-border">
        {tabs.length === 0 ? (
          <p className="py-8 text-center text-xs text-text-tertiary">没有可添加的标签页</p>
        ) : groups.length === 0 ? (
          <p className="py-8 text-center text-xs text-text-tertiary">没有匹配的标签页</p>
        ) : (
          groups.map((g) => (
            <div key={g.windowId}>
              <div className="backdrop-blur-glass sticky top-0 z-10 border-b border-border bg-surface-strong px-3 py-1.5 text-[11px] font-semibold text-text-primary">
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
          existing ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface',
          checked && !existing && 'bg-accent/10',
        )}
      >
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
            checked || existing ? 'border-accent bg-accent text-white' : 'border-border bg-surface',
          )}
          aria-hidden
        >
          {(checked || existing) && <Check size={11} strokeWidth={3} />}
        </span>
        <TabFavicon key={`${tab.id}-${tab.url}-${tab.favIconUrl || ''}`} tab={tab} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm text-text-primary">{tab.title}</span>
          <span className="truncate text-[11px] text-text-tertiary">{host}</span>
        </span>
        {existing && <span className="shrink-0 text-[10px] text-text-tertiary">已添加</span>}
      </button>
    </li>
  )
}

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
        className="h-4 w-4 shrink-0 object-contain"
        onError={() => setSourceIndex((i) => i + 1)}
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
