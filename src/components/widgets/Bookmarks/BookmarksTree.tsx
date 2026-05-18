import { memo } from 'react'
import { ChevronRight, Folder, BookmarkIcon } from 'lucide-react'
import { useBookmarks, type BookmarkNode } from './useBookmarks'
import { useBookmarksUiStore } from '@/store/useBookmarksUiStore'
import { cn } from '@/lib/cn'

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
          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs text-text-primary hover:bg-surface"
          style={{ paddingLeft: `${depth * 10 + 4}px` }}
        >
          <ChevronRight
            size={12}
            className={cn('shrink-0 transition', open && 'rotate-90')}
          />
          <Folder size={12} className="shrink-0 text-text-secondary" />
          <span className="truncate">{node.title || '未命名'}</span>
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
        className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-xs text-text-primary hover:bg-surface"
        style={{ paddingLeft: `${depth * 10 + 4}px` }}
      >
        <BookmarkIcon size={12} className="shrink-0 text-text-secondary" />
        <span className="truncate">{node.title || node.url}</span>
      </a>
    </li>
  )
})

export function BookmarksTree() {
  const { tree, error } = useBookmarks()

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-text-tertiary">
        书签加载失败，请检查权限设置
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-text-tertiary">
        （开发环境无书签数据）
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <span className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
        书签
      </span>
      <ul className="-mx-1.5 flex-1 overflow-y-auto">
        {tree.map((n) => (
          <Row key={n.id} node={n} />
        ))}
      </ul>
    </div>
  )
}
