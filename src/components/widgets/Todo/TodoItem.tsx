import { memo } from 'react'
import { X } from 'lucide-react'
import { useTodoStore, type TodoItem as Item } from '@/store/useTodoStore'
import { cn } from '@/lib/cn'

interface Props {
  item: Item
}

/** A Reminders row: the ring fills in with the accent colour when done. */
export const TodoItem = memo(function TodoItem({ item }: Props) {
  const toggle = useTodoStore((s) => s.toggle)
  const remove = useTodoStore((s) => s.remove)

  return (
    <li className="widget-row group">
      <button
        type="button"
        onClick={() => toggle(item.id)}
        aria-label={item.done ? '标记为未完成' : '标记为已完成'}
        className={cn(
          // The pseudo-element widens the hit area past the 18px ring.
          "relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-[border-color,transform] duration-fast after:absolute after:-inset-1.5 after:content-[''] active:scale-90",
          item.done ? 'border-accent' : 'border-text-tertiary hover:border-accent',
        )}
      >
        {item.done && <span className="animate-check-in h-2.5 w-2.5 rounded-full bg-accent" />}
      </button>
      <span
        title={item.text}
        className={cn(
          'min-w-0 flex-1 truncate',
          item.done && 'text-text-secondary line-through decoration-text-tertiary',
        )}
      >
        {item.text}
      </span>
      <button
        type="button"
        onClick={() => remove(item.id)}
        aria-label="删除"
        title="删除"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-secondary opacity-0 transition-[opacity,background-color,color] duration-fast hover:bg-fill-strong hover:text-text-primary focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <X size={12} strokeWidth={2.5} aria-hidden />
      </button>
    </li>
  )
})
