import { useState } from 'react'
import { Plus, Trash2, CheckCircle } from 'lucide-react'
import { useTodoStore } from '@/store/useTodoStore'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const items = useTodoStore((s) => s.items)
  const add = useTodoStore((s) => s.add)
  const clearCompleted = useTodoStore((s) => s.clearCompleted)
  const [draft, setDraft] = useState('')

  const handleAdd = () => {
    if (!draft.trim()) return
    add(draft)
    setDraft('')
  }

  const hasDone = items.some((i) => i.done)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary" aria-live="polite" aria-atomic="true">
          待办 · {items.filter((i) => !i.done).length}
        </span>
        {hasDone && (
          <button
            onClick={clearCompleted}
            className="flex items-center gap-1 text-xs text-text-tertiary hover:text-red-500"
            aria-label="清除已完成"
          >
            <Trash2 size={12} /> 清除
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 rounded-btn bg-surface-strong px-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="添加一项…"
          aria-label="添加待办事项"
          className="flex-1 bg-transparent py-1.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="rounded p-1 text-text-secondary hover:text-accent disabled:opacity-40"
          aria-label="添加"
        >
          <Plus size={14} />
        </button>
      </div>

      <ul className="-mx-1 mt-2 flex-1 space-y-1 overflow-y-auto pr-1">
        {items.length === 0 && (
          <li className="flex h-full flex-col items-center justify-center py-6 text-center">
            <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong/30 text-text-tertiary">
              <CheckCircle size={18} className="stroke-[1.5]" />
            </div>
            <p className="text-xs font-medium text-text-secondary">没有待办事项</p>
            <p className="mt-0.5 text-[11px] text-text-tertiary">在输入框输入，轻松开启一天工作</p>
          </li>
        )}
        {items.map((it) => (
          <TodoItem key={it.id} item={it} />
        ))}
      </ul>
    </div>
  )
}
