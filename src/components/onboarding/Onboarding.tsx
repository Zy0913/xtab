import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PRESETS } from '@/lib/wallpapers'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useLayoutStore } from '@/store/useLayoutStore'
import { WIDGET_LABELS, type WidgetId } from '@/types/widget'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { RowLabel } from '@/components/settings/SettingsSection'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/lib/useFocusTrap'

type Step = 0 | 1 | 2

const STEPS: Step[] = [0, 1, 2]
const OPTIONAL_WIDGETS: Array<{ id: WidgetId; description: string }> = [
  { id: 'todo', description: '随手记下要做的事' },
  { id: 'bookmarks', description: '展开浏览 Chrome 书签' },
]
const PRESET_PICKS = PRESETS.slice(0, 6)
/** --dur-slow: the sheet has faded out by the time it unmounts. */
const EXIT_MS = 260

/** The app icon of the welcome sheet: a tiny new tab page on the wallpaper. */
function AppIcon({ thumb }: { thumb: string }) {
  return (
    <div
      aria-hidden
      className="relative mx-auto h-16 w-16 overflow-hidden rounded-[15px] shadow-[0_6px_16px_rgb(0_0_0/0.2)]"
    >
      <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-x-3 top-[22px] h-2 rounded-full bg-white/85" />
      <div className="absolute inset-x-0 top-[36px] flex justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 rounded-[3px] bg-white/70" />
        ))}
      </div>
      <span className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.35)]" />
    </div>
  )
}

/**
 * First-run sheet in the manner of a macOS welcome window: app icon and a
 * short pitch, then wallpaper and optional widgets. Every step has the same
 * height and keeps its buttons in the same place.
 */
export function Onboarding() {
  const onboardingDone = useSettingsStore((s) => s.onboardingDone)
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding)
  const wallpaper = useSettingsStore((s) => s.wallpaper)
  const setWallpaper = useSettingsStore((s) => s.setWallpaper)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)
  const enabled = useLayoutStore((s) => s.enabled)
  const toggleWidget = useLayoutStore((s) => s.toggleWidget)

  const [step, setStep] = useState<Step>(0)
  const [exiting, setExiting] = useState(false)
  const trapRef = useFocusTrap(!onboardingDone && !exiting)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stepChanged = useRef(false)
  const titleId = useId()

  // The button that was pressed is gone with its step; put focus on the new
  // step's heading instead of losing it to the page.
  useEffect(() => {
    if (stepChanged.current) headingRef.current?.focus()
  }, [step])

  if (onboardingDone) return null

  const go = (next: Step) => {
    stepChanged.current = true
    setStep(next)
  }

  const finish = () => {
    if (exiting) return
    if (reduceMotion) {
      completeOnboarding()
      return
    }
    setExiting(true)
    window.setTimeout(() => completeOnboarding(), EXIT_MS)
  }

  // The icon shows the wallpaper behind the sheet when it is a preset, and
  // the default, the first of them, when it is not.
  const iconThumb = (PRESETS.find((p) => p.url === wallpaper) ?? PRESETS[0]).thumb
  const heading = 'text-[1.375rem] font-bold leading-tight text-text-primary outline-none'
  const portalRoot = document.getElementById('portal-root') || document.body

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      {/* A sibling, not a parent: a fading ancestor would cut the sheet's
          backdrop blur off from the page. */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 transition-opacity duration-slow',
          exiting ? 'opacity-0' : 'animate-fade-in',
        )}
        style={{ backgroundColor: 'var(--scrim)' }}
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => e.key === 'Escape' && finish()}
        className={cn(
          'material-pop flex max-h-full min-h-[min(25rem,100%)] w-full max-w-[25rem] flex-col overflow-y-auto rounded-panel px-7 pb-7 pt-6 outline-none transition-[opacity,transform] duration-slow',
          exiting ? 'scale-[0.97] opacity-0' : 'animate-pop-in',
        )}
      >
        <div className="mb-5 flex items-center justify-center gap-1.5" aria-hidden>
          {STEPS.map((s) => (
            <span
              key={s}
              className={cn(
                'h-1.5 rounded-full transition-[width,background-color] duration-slow',
                s === step ? 'w-4 bg-text-primary' : 'w-1.5 bg-text-tertiary',
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-in flex flex-1 flex-col text-center">
            <AppIcon thumb={iconThumb} />
            <h1
              id={titleId}
              ref={headingRef}
              tabIndex={-1}
              className="mt-5 text-[1.625rem] font-bold leading-tight text-text-primary outline-none"
            >
              把新标签页
              <br />
              做成自己的
            </h1>
            {/* One sentence per line, so no word is left alone on the last. */}
            <p className="mx-auto mt-2.5 text-callout leading-relaxed text-text-secondary">
              选一张壁纸，挑几个组件。
              <br />按 <kbd className="keycap mx-0.5 align-[1px]">/</kbd> 就能搜索。
            </p>
            <div className="mt-auto flex flex-col gap-1.5 pt-8">
              <Button variant="primary" className="h-9 w-full" onClick={() => go(1)}>
                开始
              </Button>
              <Button variant="ghost" className="h-9 w-full" onClick={finish}>
                稍后再说
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in flex flex-1 flex-col">
            <h2 id={titleId} ref={headingRef} tabIndex={-1} className={cn(heading, 'text-center')}>
              选一张壁纸
            </h2>
            <p className="mt-1.5 text-center text-body text-text-secondary">
              之后随时可在设置里更换或随机。
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {PRESET_PICKS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setWallpaper(p.url)}
                  aria-label={p.name}
                  aria-pressed={wallpaper === p.url}
                  title={p.name}
                  // Selected: an accent ring held off the picture by a gap,
                  // as in System Settings › Wallpaper.
                  className="group relative aspect-video overflow-hidden rounded-[10px] bg-fill transition-shadow duration-fast aria-pressed:shadow-[0_0_0_2px_rgb(var(--mat-rgb)),0_0_0_4.5px_var(--accent)]"
                >
                  <img
                    src={p.thumb}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-[1.04]"
                  />
                </button>
              ))}
            </div>
            <div className="mt-auto flex gap-2 pt-6">
              <Button className="h-9 flex-1" onClick={() => go(0)}>
                上一步
              </Button>
              <Button variant="primary" className="h-9 flex-1" onClick={() => go(2)}>
                继续
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in flex flex-1 flex-col">
            <h2 id={titleId} ref={headingRef} tabIndex={-1} className={cn(heading, 'text-center')}>
              还要显示什么？
            </h2>
            <p className="mt-1.5 text-center text-body text-text-secondary">
              时钟、搜索、快捷方式和天气已就绪。可选加上：
            </p>
            <div className="form-group mt-5">
              {OPTIONAL_WIDGETS.map(({ id, description }) => (
                <div key={id} className="form-row">
                  <RowLabel
                    id={`onboarding-${id}`}
                    label={WIDGET_LABELS[id]}
                    description={description}
                  />
                  <Switch
                    checked={enabled.includes(id)}
                    onChange={() => toggleWidget(id)}
                    aria-labelledby={`onboarding-${id}`}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-caption leading-relaxed text-text-secondary">
              提示：按 E 编辑布局，按逗号打开设置，按 ? 查看全部快捷键。
            </p>
            <div className="mt-auto flex gap-2 pt-6">
              <Button className="h-9 flex-1" onClick={() => go(1)}>
                上一步
              </Button>
              <Button variant="primary" className="h-9 flex-1" onClick={finish}>
                进入新标签页
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    portalRoot,
  )
}
