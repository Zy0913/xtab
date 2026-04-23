import { useState } from 'react'
import { Pencil, Check, Settings } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { DashboardGrid } from '@/components/layout/DashboardGrid'
import { SettingsDrawer } from '@/components/settings/SettingsDrawer'
import { useShortcut } from '@/lib/useShortcut'
import { useWallpaper } from '@/lib/useWallpaper'

export default function App() {
  const editMode = useSettingsStore((s) => s.editMode)
  const toggleEditMode = useSettingsStore((s) => s.toggleEditMode)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { loadedUrl, prevUrl, visible } = useWallpaper()

  useShortcut('e', toggleEditMode)
  useShortcut(',', () => setSettingsOpen((v) => !v))

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-900 dark:bg-black">
      {/* Bottom layer: previous wallpaper — stays visible during cross-fade */}
      {prevUrl && prevUrl !== loadedUrl && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${prevUrl})` }}
        />
      )}

      {/* Top layer: current wallpaper — cross-fade in with scale + opacity */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: loadedUrl ? `url(${loadedUrl})` : undefined,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(1.03)',
          transition: 'opacity 700ms cubic-bezier(0.4, 0, 0.2, 1), transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Atmospheric overlay — adapts to theme via CSS variable */}
      <div
        className="pointer-events-none absolute inset-0 transition-colors duration-500"
        style={{ backgroundColor: 'var(--overlay)' }}
      />

      <header className="absolute right-6 top-6 z-50 flex items-center gap-2">
        <button
          onClick={toggleEditMode}
          className="inline-flex h-8 items-center gap-1.5 rounded-btn bg-surface px-3 text-xs text-text-primary shadow-card backdrop-blur-glass transition hover:bg-surface-strong"
          style={{ transitionDuration: 'var(--transition-duration)' }}
          aria-label={editMode ? '完成编辑' : '编辑布局'}
        >
          {editMode ? <Check size={14} /> : <Pencil size={14} />}
          {editMode ? '完成' : '编辑'}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-btn bg-surface text-text-primary shadow-card backdrop-blur-glass transition hover:bg-surface-strong"
          style={{ transitionDuration: 'var(--transition-duration)' }}
          aria-label="打开设置"
        >
          <Settings size={14} />
        </button>
      </header>

      <main className="relative z-10 mx-auto min-h-screen max-w-6xl px-6 pt-20 pb-6">
        <DashboardGrid />
      </main>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}