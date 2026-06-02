import { useMemo, useState } from 'react'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { showToast } from '@/lib/toast'
import {
  useOpenTabs,
  groupTabsByWindow,
  normalizeUrlKey,
  type OpenTab,
  type OpenTabsGroup,
} from './useOpenTabs'

interface UseTabsPickerOptions {
  active: boolean
  onClose: () => void
}

interface UseTabsPickerReturn {
  tabs: OpenTab[]
  error: string | null
  refresh: () => void
  query: string
  setQuery: (q: string) => void
  groups: OpenTabsGroup[]
  existingKeys: Set<string>
  selected: Set<string>
  toggle: (key: string) => void
  toggleAll: () => void
  allSelected: boolean
  selectableKeys: string[]
  totalSelected: number
  handleSubmit: () => void
}

export function useTabsPicker({ active, onClose }: UseTabsPickerOptions): UseTabsPickerReturn {
  const { tabs, error, refresh } = useOpenTabs(active)
  const add = useShortcutsStore((s) => s.add)
  const items = useShortcutsStore((s) => s.items)

  // Compare by canonical key so that `https://github.com` and `https://github.com/`
  // are treated as the same shortcut.
  const existingKeys = useMemo(() => new Set(items.map((it) => normalizeUrlKey(it.url))), [items])

  const [query, setQuery] = useState('')
  // Selection is keyed by normalized URL — survives across refreshes. We
  // intentionally don't prune on tab close: if a tab reappears (e.g. browser
  // restored it), the user's prior selection is preserved.
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Live keys = tabs currently visible in the picker. We display and submit
  // based on the intersection so closed tabs don't inflate the count.
  const liveKeys = useMemo(() => new Set(tabs.map((t) => normalizeUrlKey(t.url))), [tabs])
  const liveSelected = useMemo(() => {
    const out = new Set<string>()
    for (const k of selected) if (liveKeys.has(k)) out.add(k)
    return out
  }, [selected, liveKeys])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tabs
    return tabs.filter((t) => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q))
  }, [tabs, query])

  const groups = useMemo(() => groupTabsByWindow(filtered), [filtered])

  const selectableKeys = useMemo(
    () => filtered.map((t) => normalizeUrlKey(t.url)).filter((k) => !existingKeys.has(k)),
    [filtered, existingKeys],
  )
  const allSelected = selectableKeys.length > 0 && selectableKeys.every((k) => selected.has(k))

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

  const totalSelected = liveSelected.size

  return {
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
  }
}
