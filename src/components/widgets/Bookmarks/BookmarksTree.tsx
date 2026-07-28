import { memo, useState, useMemo } from 'react'
import { ChevronRight, Folder, BookOpen } from 'lucide-react'
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

function BookmarkFavicon({ url, title }: { url: string; title: string }) {
  const sources = useMemo(() => getFaviconSources(url), [url])
  const [sourceIndex, setSourceIndex] = useState(0)

  if (sourceIndex < sources.length) {
    return (
      <img
        src={sources[sourceIndex]}
        alt=""
        width={14}
        height={14}
        className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain"
        onError={() => setSourceIndex((i) => i + 1)}
      />
    )
  }

  return (
    <span
      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm text-[8px] font-semibold text-white"
      style={{ backgroundColor: getColorFor(title || url) }}
      aria-hidden
    >
      {getInitial(title || url)}
    </span>
  )
}

const Row = memo(function Row({ node, depth = 0 }: { node: BookmarkNode; depth?: number }) {
  const expandedIds = useBookmarksUiStore((s) => s.expandedIds)
  const toggleExpanded = useBookmarksUiStore((s) => s.toggleExpanded)
  const open = expandedIds.includes(node.id)
  const isFolder = !node.url

  if (isFolder) {
    return (
      <li>
        <button
          onClick={() => toggleExpanded(node.id)}
          aria-expanded={open}
          className="widget-row text-left"
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
        >
          <ChevronRight
            size={12}
            className={cn('shrink-0 text-text-tertiary transition', open && 'rotate-90')}
          />
          <span className="bg-accent/15 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] text-accent">
            <Folder size={10} strokeWidth={2} />
          </span>
          <span className="truncate text-caption">{node.title || '未命名'}</span>
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
        className="widget-row"
        style={{ paddingLeft: `${depth * 12 + 6 + 18}px` }}
      >
        <BookmarkFavicon url={node.url!} title={node.title || node.url || ''} />
        <span className="truncate text-caption">{node.title || node.url}</span>
      </a>
    </li>
  )
})

export function BookmarksTree() {
  const { tree, error } = useBookmarks()

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <WidgetHeader title="书签" />
        <WidgetEmpty
          icon={<BookOpen size={18} className="stroke-[1.5]" />}
          title="书签加载失败"
          description="请确保已授予书签访问权限"
        />
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <WidgetHeader title="书签" />
        <WidgetEmpty
          icon={<BookOpen size={18} className="stroke-[1.5]" />}
          title="暂无书签"
          description="在 Chrome 中添加书签后会出现在这里"
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <WidgetHeader title="书签" />
      <ul className="-mx-1 flex-1 overflow-y-auto">
        {tree.map((n) => (
          <Row key={n.id} node={n} />
        ))}
      </ul>
    </div>
  )
}
