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
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-surface/50 backdrop-blur-glass group flex h-14 w-14 flex-col items-center justify-center gap-2 rounded-card text-text-tertiary shadow-sm transition hover:bg-surface hover:text-text-primary hover:shadow"
            aria-label="添加快捷方式"
          >
            <Plus size={24} strokeWidth={1.5} />
          </button>
          {/* Empty spacer to perfectly match the height of other tiles with text */}
          <span className="h-4 text-xs opacity-0">添加</span>
        </div>
      </div>
      <AddShortcutDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
