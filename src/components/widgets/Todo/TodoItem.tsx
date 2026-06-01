import { memo } from 'react'
import { Check, X } from 'lucide-react'
import { useTodoStore, type TodoItem as Item } from '@/store/useTodoStore'
import { cn } from '@/lib/cn'

interface Props {
  item: Item
}

export const TodoItem = memo(function TodoItem({ item }: Props) {
  const toggle = useTodoStore((s) => s.toggle)
  const remove = useTodoStore((s) => s.remove)

  return (
    <li className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-surface">
      <button
        onClick={() => toggle(item.id)}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition active:scale-90',
          item.done ? 'border-accent bg-accent text-white' : 'border-border hover:border-accent',
        )}
        aria-label={item.done ? '标记为未完成' : '标记为已完成'}
      >
        {item.done && <Check size={10} className="animate-spring-in" />}
      </button>
      <span
        className={cn(
          'flex-1 truncate text-sm',
          item.done ? 'text-text-tertiary line-through' : 'text-text-primary',
        )}
      >
        {item.text}
      </span>
      <button
        onClick={() => remove(item.id)}
        className="rounded p-0.5 text-text-tertiary opacity-0 transition hover:text-red-500 group-hover:opacity-100"
        aria-label="删除"
      >
        <X size={12} />
      </button>
    </li>
  )
})
