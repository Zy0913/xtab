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
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
        {items.map((shortcut) => (
          <ShortcutTile key={shortcut.id} shortcut={shortcut} editable={editMode} />
        ))}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setDialogOpen(true)}
            className="group flex h-14 w-14 flex-col items-center justify-center gap-2 rounded-card bg-surface/50 text-text-tertiary shadow-sm backdrop-blur-glass transition hover:bg-surface hover:text-text-primary hover:shadow"
            aria-label="添加快捷方式"
          >
            <Plus size={24} strokeWidth={1.5} />
          </button>
          {/* Empty spacer to perfectly match the height of other tiles with text */}
          <span className="h-4 opacity-0 text-xs">添加</span>
        </div>
      </div>
      <AddShortcutDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
