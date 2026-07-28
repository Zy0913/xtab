import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronRight } from 'lucide-react'
import { PRESETS } from '@/lib/wallpapers'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useLayoutStore } from '@/store/useLayoutStore'
import { WIDGET_LABELS, type WidgetId } from '@/types/widget'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/lib/useFocusTrap'

type Step = 0 | 1 | 2

const OPTIONAL_WIDGETS: WidgetId[] = ['todo', 'bookmarks']
const PRESET_PICKS = PRESETS.slice(0, 6)

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

  if (onboardingDone) return null

  const finish = () => {
    if (reduceMotion) {
      completeOnboarding()
      return
    }
    setExiting(true)
    window.setTimeout(() => completeOnboarding(), 280)
  }

  const portalRoot = document.getElementById('portal-root') || document.body

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[80] flex items-center justify-center p-4 transition-all duration-300',
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      style={{ backgroundColor: 'rgba(0,0,0,0.42)' }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="初次设置"
        className={cn(
          'backdrop-blur-glass glass-noise relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-border bg-surface-strong p-6 shadow-pop transition-all duration-300 sm:p-7',
          exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100',
        )}
      >
        {/* Step dots */}
        <div className="mb-6 flex items-center justify-center gap-1.5" aria-hidden>
          {([0, 1, 2] as Step[]).map((s) => (
            <span
              key={s}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                s === step ? 'w-5 bg-accent' : s < step ? 'bg-accent/40 w-3' : 'w-3 bg-border',
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-up text-center">
            <p className="text-micro font-medium tracking-[0.22em] text-text-tertiary">WELCOME</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary sm:text-[1.7rem]">
              把新标签页
              <br />
              做成自己的
            </h1>
            <p className="mx-auto mt-3 max-w-[18rem] text-sm leading-relaxed text-text-secondary">
              选一张壁纸，挑几个组件。按{' '}
              <kbd className="mx-0.5 rounded bg-surface px-1.5 py-0.5 text-micro shadow-card">
                /
              </kbd>{' '}
              就能搜索。
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <Button
                variant="primary"
                className="h-10 w-full rounded-full"
                onClick={() => setStep(1)}
              >
                开始
                <ChevronRight size={16} />
              </Button>
              <button
                type="button"
                onClick={finish}
                className="py-2 text-xs text-text-tertiary transition hover:text-text-secondary"
              >
                稍后再说
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">选一张壁纸</h2>
            <p className="mt-1 text-sm text-text-secondary">之后随时可在设置里更换或随机。</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {PRESET_PICKS.map((p) => {
                const active = wallpaper === p.url
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setWallpaper(p.url)}
                    className={cn(
                      'group relative aspect-video overflow-hidden rounded-btn border-2 transition',
                      active ? 'border-accent' : 'border-transparent hover:border-border',
                    )}
                    aria-label={p.name}
                    aria-pressed={active}
                  >
                    <img
                      src={p.thumb}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {active && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="ghost" className="flex-1 rounded-full" onClick={() => setStep(0)}>
                上一步
              </Button>
              <Button variant="primary" className="flex-1 rounded-full" onClick={() => setStep(2)}>
                下一步
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">
              还要显示什么？
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              时钟、搜索、快捷方式和天气已就绪。可选加上：
            </p>
            <div className="border-border/70 mt-4 space-y-1 rounded-card border bg-surface p-1.5">
              {OPTIONAL_WIDGETS.map((id) => {
                const on = enabled.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleWidget(id)}
                    className="flex w-full items-center justify-between rounded-btn px-3 py-2.5 text-left text-sm transition hover:bg-surface-strong"
                  >
                    <span className="text-text-primary">{WIDGET_LABELS[id]}</span>
                    <span
                      className={cn(
                        'relative h-5 w-9 rounded-full transition',
                        on ? 'bg-accent' : 'bg-text-tertiary/40',
                      )}
                      aria-hidden
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
                          on ? 'left-[18px]' : 'left-0.5',
                        )}
                      />
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-micro leading-relaxed text-text-tertiary">
              提示：按 <span className="text-text-secondary">E</span> 编辑布局，
              <span className="text-text-secondary"> , </span>
              打开设置，
              <span className="text-text-secondary"> ? </span>
              查看全部快捷键。
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="ghost" className="flex-1 rounded-full" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button variant="primary" className="flex-1 rounded-full" onClick={finish}>
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
