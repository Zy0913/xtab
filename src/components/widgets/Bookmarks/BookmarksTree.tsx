import { memo, useState, useMemo } from 'react'
import { ChevronRight, Folder, Bookmark } from 'lucide-react'
import { useBookmarks, type BookmarkNode } from './useBookmarks'
import { useBookmarksUiStore } from '@/store/useBookmarksUiStore'
import {
  getFaviconSources,
  getInitial,
  getColorFor,
} from '@/components/widgets/Shortcuts/faviconFetcher'
import { WidgetHeader } from '@/components/layout/WidgetHeader'
import { WidgetEmpty } from '@/components/layout/WidgetEmpty'
import { cn } from '@/lib/cn'

/** Indent per level and the room a folder's disclosure chevron takes. */
const INDENT = 16
const ROW_PAD = 8
const CHEVRON = 20

function BookmarkFavicon({ url, title }: { url: string; title: string }) {
  const sources = useMemo(() => getFaviconSources(url), [url])
  const [sourceIndex, setSourceIndex] = useState(0)

  if (sourceIndex < sources.length) {
    return (
      <img
        src={sources[sourceIndex]}
        alt=""
        width={16}
        height={16}
        referrerPolicy="no-referrer"
        className="h-4 w-4 shrink-0 rounded-[4px] object-contain"
        onError={() => setSourceIndex((i) => i + 1)}
      />
    )
  }

  return (
    <span
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-semibold text-white"
      style={{ backgroundColor: getColorFor(title || url) }}
      aria-hidden
    >
      {getInitial(title || url)}
    </span>
  )
}

/** A Safari sidebar row: disclosure chevron and accent folder, or a favicon. */
const Row = memo(function Row({ node, depth = 0 }: { node: BookmarkNode; depth?: number }) {
  const expandedIds = useBookmarksUiStore((s) => s.expandedIds)
  const toggleExpanded = useBookmarksUiStore((s) => s.toggleExpanded)
  const open = expandedIds.includes(node.id)
  const isFolder = !node.url

  if (isFolder) {
    return (
      <li>
        <button
          type="button"
          onClick={() => toggleExpanded(node.id)}
          aria-expanded={open}
          className="widget-row text-left"
          style={{ paddingLeft: depth * INDENT + ROW_PAD }}
        >
          <ChevronRight
            size={12}
            strokeWidth={2.5}
            aria-hidden
            className={cn(
              'w-3 shrink-0 text-text-tertiary transition-transform duration-fast',
              open && 'rotate-90',
            )}
          />
          <Folder size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-accent" />
          <span className="truncate">{node.title || '未命名文件夹'}</span>
        </button>
        {open && (
          <ul>
            {node.children?.map((child) => (
              <Row key={child.id} node={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <li>
      <a
        href={node.url}
        target="_blank"
        rel="noopener noreferrer"
        title={node.url}
        className="widget-row"
        style={{ paddingLeft: depth * INDENT + ROW_PAD + CHEVRON }}
      >
        <BookmarkFavicon url={node.url!} title={node.title || node.url || ''} />
        <span className="truncate">{node.title || node.url}</span>
      </a>
    </li>
  )
})

export function BookmarksTree() {
  const { tree, error } = useBookmarks()

  const empty = error ? (
    <WidgetEmpty
      icon={<Bookmark size={18} strokeWidth={1.75} />}
      title="无法读取书签"
      description="请在扩展设置中允许访问书签"
    />
  ) : tree.length === 0 ? (
    <WidgetEmpty
      icon={<Bookmark size={18} strokeWidth={1.75} />}
      title="还没有书签"
      description="在 Chrome 中添加的书签会出现在这里"
    />
  ) : null

  return (
    <div className="flex h-full flex-col">
      <WidgetHeader title="书签" />
      {empty ?? (
        <ul className="-mx-2 flex-1 overflow-y-auto" aria-label="书签">
          {tree.map((n) => (
            <Row key={n.id} node={n} />
          ))}
        </ul>
      )}
    </div>
  )
}
