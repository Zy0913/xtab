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
        <div className="flex w-full flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            aria-label="添加快捷方式"
            title="添加快捷方式（⇧T）"
            className="tile flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-tile text-text-secondary transition-[transform,color] duration-fast hover:-translate-y-0.5 hover:text-text-primary active:translate-y-0 active:scale-95"
          >
            <Plus size={22} strokeWidth={1.75} aria-hidden />
          </button>
          <span
            aria-hidden
            className="text-shadow-wallpaper text-caption font-medium text-wp-secondary"
          >
            添加
          </span>
        </div>
      </div>
      <AddShortcutDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
