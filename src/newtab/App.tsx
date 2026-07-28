import { useState } from 'react'
import { Pencil, Check, Settings, HelpCircle } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { DashboardGrid } from '@/components/layout/DashboardGrid'
import { SettingsDrawer } from '@/components/settings/SettingsDrawer'
import { KeyboardHelp } from '@/components/ui/KeyboardHelp'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { useShortcut } from '@/lib/useShortcut'
import { useWallpaper } from '@/lib/useWallpaper'
import { cn } from '@/lib/cn'

export default function App() {
  const editMode = useSettingsStore((s) => s.editMode)
  const toggleEditMode = useSettingsStore((s) => s.toggleEditMode)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)
  const wallpaperDimming = useSettingsStore((s) => s.wallpaperDimming)
  const onboardingDone = useSettingsStore((s) => s.onboardingDone)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const { loadedUrl, prevUrl, visible } = useWallpaper()
  const fadeMs = reduceMotion ? 0 : 700
  const overlayMs = reduceMotion ? 0 : 500

  useShortcut('e', toggleEditMode)
  useShortcut(',', () => setSettingsOpen((v) => !v))
  useShortcut('?', () => setHelpOpen((v) => !v))

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
          transition: `opacity ${fadeMs}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${fadeMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      />

      {/* Atmospheric overlay — adapts to theme via CSS variable */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: 'var(--overlay)',
          transition: `background-color ${overlayMs}ms`,
        }}
      />

      {/* User-controlled wallpaper dimming — keeps foreground text readable */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${wallpaperDimming})`,
          transition: `background-color ${overlayMs}ms`,
        }}
      />

      {/* Top-region vignette — softer, protects clock without muddying the scene */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[50vh]"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Control cluster — unmount when settings/help open so it cannot stack on the drawer */}
      {onboardingDone && !settingsOpen && !helpOpen && (
        <header className="absolute right-5 top-5 z-50 sm:right-6 sm:top-6">
          <div className="backdrop-blur-glass glass-noise relative flex items-center gap-0.5 rounded-full bg-surface p-1 shadow-card">
            <button
              onClick={toggleEditMode}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-text-primary transition',
                editMode ? 'bg-accent/20 text-text-primary' : 'hover:bg-surface-strong',
              )}
              style={{ transitionDuration: 'var(--transition-duration)' }}
              aria-label={editMode ? '完成编辑' : '编辑布局'}
            >
              {editMode ? <Check size={14} /> : <Pencil size={14} />}
              <span className="hidden sm:inline">{editMode ? '完成' : '编辑'}</span>
            </button>
            <div className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
            <button
              onClick={() => setHelpOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-surface-strong"
              style={{ transitionDuration: 'var(--transition-duration)' }}
              aria-label="快捷键帮助"
              title="快捷键帮助 (?)"
            >
              <HelpCircle size={14} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-surface-strong"
              style={{ transitionDuration: 'var(--transition-duration)' }}
              aria-label="打开设置"
            >
              <Settings size={14} />
            </button>
          </div>
        </header>
      )}

      <main
        className={cn(
          'relative z-10 mx-auto min-h-screen w-full max-w-[1360px] px-6 pb-12 pt-20 sm:px-10 sm:pb-14 sm:pt-24 lg:px-12 lg:pt-28',
          onboardingDone && 'animate-fade-up',
        )}
      >
        <DashboardGrid />
      </main>

      {/* Edit-mode coaching chip */}
      <div
        className={cn(
          'pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transition-all duration-300',
          editMode && onboardingDone ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        <div className="backdrop-blur-glass glass-noise rounded-full border border-border bg-surface px-4 py-2 text-micro text-text-secondary shadow-card">
          拖动顶部把手移动 · 右下角缩放 · 按{' '}
          <kbd className="rounded bg-surface-strong px-1.5 py-0.5 text-text-primary">E</kbd> 完成
        </div>
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <KeyboardHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Onboarding />
    </div>
  )
}
