import { useEffect, useState } from 'react'

export interface BookmarkNode {
  id: string
  title: string
  url?: string
  children?: BookmarkNode[]
}

function normalize(raw: chrome.bookmarks.BookmarkTreeNode): BookmarkNode {
  return {
    id: raw.id,
    title: raw.title,
    url: raw.url,
    children: raw.children?.map(normalize),
  }
}

export function useBookmarks() {
  const [tree, setTree] = useState<BookmarkNode[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.bookmarks?.getTree) return

    const load = () => {
      chrome.bookmarks.getTree((roots) => {
        if (chrome.runtime.lastError) {
          const msg = chrome.runtime.lastError.message ?? '书签加载失败'
          console.error('Bookmarks error:', msg)
          setError(msg)
          return
        }
        setError(null)
        const normalized = roots.flatMap((r) => r.children?.map(normalize) ?? [])
        setTree(normalized)
      })
    }

    load()

    const relevant = [
      chrome.bookmarks.onCreated,
      chrome.bookmarks.onRemoved,
      chrome.bookmarks.onChanged,
      chrome.bookmarks.onMoved,
    ]
    relevant.forEach((ev) => ev.addListener(load))
    return () => relevant.forEach((ev) => ev.removeListener(load))
  }, [])

  return { tree, error }
}
