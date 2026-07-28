import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useShortcut } from '@/lib/useShortcut'
import { ShortcutTile } from './ShortcutTile'
import { AddShortcutDialog } from './AddShortcutDialog'

export function ShortcutsGrid() {
  const items = useShortcutsStore((s) => s.items)
  const editMode = useSettingsStore((s) => s.editMode)
  const [dialogOpen, setDialogOpen] = useState(false)

  useShortcut('T', () => setDialogOpen(true))

  return (
    <>
      <div className="shortcut-grid">
        {items.map((shortcut) => (
          <ShortcutTile
            key={`${shortcut.id}-${shortcut.url}-${shortcut.iconUrl || ''}`}
            shortcut={shortcut}
            editable={editMode}
          />
        ))}
        <div className="flex w-full flex-col items-center gap-1">
          <button
            onClick={() => setDialogOpen(true)}
            className="border-border/80 bg-surface/40 backdrop-blur-glass group flex h-12 w-12 items-center justify-center rounded-[14px] border border-dashed text-text-tertiary transition hover:border-border hover:bg-surface hover:text-text-primary sm:h-[3.15rem] sm:w-[3.15rem]"
            aria-label="添加快捷方式"
          >
            <Plus size={20} strokeWidth={1.5} />
          </button>
          <span className="h-4 text-micro opacity-0 sm:text-[11px]" aria-hidden>
            添加
          </span>
        </div>
      </div>
      <AddShortcutDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
