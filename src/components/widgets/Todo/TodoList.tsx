import { useState } from 'react'
import { CheckCircle, Plus } from 'lucide-react'
import { useTodoStore } from '@/store/useTodoStore'
import { TodoItem } from './TodoItem'
import { WidgetHeader } from '@/components/layout/WidgetHeader'
import { WidgetEmpty } from '@/components/layout/WidgetEmpty'

/** Reminders widget: list name with the open count, a new-item row, the list. */
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
  const doneCount = items.length - openCount

  return (
    <div className="flex h-full flex-col">
      <WidgetHeader
        title="待办"
        trailing={
          <span
            aria-live="polite"
            aria-atomic="true"
            className="text-[1.375rem] font-semibold tabular-nums leading-none text-accent"
          >
            <span className="sr-only">未完成 </span>
            {openCount}
          </span>
        }
      />

      {/* Shaped like a row so the text lines up with the items below. */}
      <div className="-mx-2 flex min-h-7 items-center gap-2 rounded-row px-2 has-[input:focus-visible]:outline has-[input:focus-visible]:outline-[3px] has-[input:focus-visible]:outline-[color:var(--focus-color)]">
        <Plus size={18} strokeWidth={2} className="shrink-0 text-text-tertiary" aria-hidden />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          // Enter also confirms an input-method candidate; leave that alone.
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAdd()}
          placeholder="新待办"
          aria-label="添加待办事项"
          className="h-7 min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none"
        />
        {draft.trim() && (
          <button
            type="button"
            onClick={handleAdd}
            aria-label="添加"
            title="添加（↩）"
            className="keycap animate-fade-in transition-colors duration-fast hover:text-text-primary"
          >
            ↩
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <WidgetEmpty
          icon={<CheckCircle size={18} strokeWidth={1.75} />}
          title="没有待办"
          description="写下今天最重要的一件事"
        />
      ) : (
        <ul className="-mx-2 mt-1 flex-1 overflow-y-auto">
          {items.map((it) => (
            <TodoItem key={it.id} item={it} />
          ))}
        </ul>
      )}

      {doneCount > 0 && (
        <div className="mt-1.5 flex items-center justify-between border-t-[0.5px] border-border pt-1.5 text-caption text-text-secondary">
          <span>{doneCount} 项已完成</span>
          <button
            type="button"
            onClick={clearCompleted}
            aria-label="清除已完成"
            className="-mr-2 rounded-full px-2 py-0.5 font-medium text-text-primary transition-colors duration-fast hover:bg-fill"
          >
            清除
          </button>
        </div>
      )}
    </div>
  )
}
