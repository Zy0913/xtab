import { useState } from 'react'
import { Plus, Trash2, CheckCircle } from 'lucide-react'
import { useTodoStore } from '@/store/useTodoStore'
import { TodoItem } from './TodoItem'
import { WidgetHeader } from '@/components/layout/WidgetHeader'
import { WidgetEmpty } from '@/components/layout/WidgetEmpty'

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

  const openCount = items.filter((i) => !i.done).length
  const hasDone = items.some((i) => i.done)

  return (
    <div className="flex h-full flex-col">
      <WidgetHeader
        title={`待办 · ${openCount}`}
        live
        trailing={
          hasDone ? (
            <button
              onClick={clearCompleted}
              className="flex items-center gap-1 text-micro text-text-tertiary transition hover:text-danger"
              aria-label="清除已完成"
            >
              <Trash2 size={12} /> 清除
            </button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-1.5 rounded-btn bg-surface-strong px-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="添加一项…"
          aria-label="添加待办事项"
          className="flex-1 bg-transparent py-1.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="rounded p-1 text-text-secondary transition hover:text-accent disabled:opacity-40"
          aria-label="添加"
        >
          <Plus size={14} />
        </button>
      </div>

      <ul className="-mx-1 mt-2 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
        {items.length === 0 && (
          <li className="list-none">
            <WidgetEmpty
              icon={<CheckCircle size={18} className="stroke-[1.5]" />}
              title="没有待办"
              description="写下今天最重要的一件事"
            />
          </li>
        )}
        {items.map((it) => (
          <TodoItem key={it.id} item={it} />
        ))}
      </ul>
    </div>
  )
}
