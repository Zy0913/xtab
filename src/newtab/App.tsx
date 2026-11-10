import { useState, type ReactNode } from 'react'
import { Keyboard, Pencil, Settings } from 'lucide-react'
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
  // A plain cross-fade, the way macOS swaps the desktop picture.
  const fadeMs = reduceMotion ? 0 : 400

  useShortcut('e', toggleEditMode)
  useShortcut(',', () => setSettingsOpen((v) => !v))
  useShortcut('?', () => setHelpOpen((v) => !v))

  return (
    <div className="relative min-h-screen w-full overflow-x-clip">
      {/* The wallpaper stays put while the page scrolls, like the desktop. */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        {prevUrl && prevUrl !== loadedUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${prevUrl})` }}
          />
        )}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: loadedUrl ? `url(${loadedUrl})` : undefined,
            opacity: visible ? 1 : 0,
            transition: `opacity ${fadeMs}ms var(--ease-out)`,
          }}
        />
        {/* User dimming keeps the clock and labels legible on busy pictures. */}
        <div
          className="absolute inset-0 bg-black transition-opacity duration-slow"
          style={{ opacity: wallpaperDimming }}
        />
        {/* A soft shade behind the clock; light wallpapers get none. */}
        <div className="absolute inset-x-0 top-0 h-[55vh] bg-[linear-gradient(to_bottom,var(--wp-vignette),transparent)]" />
      </div>

      {/* Unmounted while settings or help is open so it never sits on the panel. */}
      {onboardingDone && !settingsOpen && !helpOpen && (
        <header className="on-wallpaper fixed right-4 top-4 z-chrome sm:right-5 sm:top-5">
          <div className="material animate-fade-in flex items-center gap-0.5 rounded-full p-1">
            <ToolbarButton
              label="编辑布局"
              shortcut="E"
              pressed={editMode}
              onClick={toggleEditMode}
            >
              <Pencil size={15} strokeWidth={1.8} />
            </ToolbarButton>
            <ToolbarButton label="键盘快捷键" shortcut="?" onClick={() => setHelpOpen(true)}>
              <Keyboard size={17} strokeWidth={1.7} />
            </ToolbarButton>
            <ToolbarButton label="设置" shortcut="," onClick={() => setSettingsOpen(true)}>
              <Settings size={16} strokeWidth={1.8} />
            </ToolbarButton>
          </div>
        </header>
      )}

      {/* Bottom padding keeps the last row clear of the edit bar. In Liquid
          Glass, ink on the dashboard follows the wallpaper (tokens.css). */}
      <main className="on-wallpaper relative mx-auto w-full max-w-[1360px] px-6 pb-24 pt-[clamp(3.5rem,10vh,7rem)] sm:px-10 lg:px-12">
        <DashboardGrid />
      </main>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <KeyboardHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Onboarding />
    </div>
  )
}

interface ToolbarButtonProps {
  label: string
  shortcut: string
  pressed?: boolean
  onClick: () => void
  children: ReactNode
}

/** Icon button in the toolbar capsule; an accent fill marks a toggle that is on. */
function ToolbarButton({ label, shortcut, pressed, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      aria-keyshortcuts={shortcut}
      title={`${label}（${shortcut}）`}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-fast',
        pressed
          ? 'bg-accent text-on-accent hover:bg-accent-hover'
          : 'text-text-primary hover:bg-fill active:bg-fill-strong',
      )}
    >
      {children}
    </button>
  )
}
