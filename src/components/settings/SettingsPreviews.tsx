import { cn } from '@/lib/cn'
import type { GlassMode, ThemeMode } from '@/store/useSettingsStore'

/* Small, static pictures for the appearance pickers. They are built from
   elements (not images) so they stay sharp and follow the accent colour. */

const TRAFFIC_LIGHTS = ['#ff5f57', '#febc2e', '#28c840']
const SKY_LIGHT = 'bg-[linear-gradient(155deg,#a8d8ff,#6492ff_55%,#9177ff)]'
const SKY_DARK = 'bg-[linear-gradient(155deg,#26355f,#121a38_55%,#2c1f52)]'
/* Spelled out in full so Tailwind's scanner sees the dark: variant. */
const SKY_BY_APPEARANCE =
  'bg-[linear-gradient(155deg,#a8d8ff,#6492ff_55%,#9177ff)] dark:bg-[linear-gradient(155deg,#26355f,#121a38_55%,#2c1f52)]'

function Desktop({ dark }: { dark: boolean }) {
  const line = dark ? 'bg-white/20' : 'bg-black/10'
  return (
    <span className={cn('absolute inset-0 block', dark ? SKY_DARK : SKY_LIGHT)}>
      <span
        className={cn(
          'absolute -bottom-2 -right-2 left-[16%] top-[22%] block overflow-hidden rounded-[5px] shadow-[0_0_0_0.5px_rgb(0_0_0/0.2),0_3px_10px_rgb(0_0_0/0.3)]',
          dark ? 'bg-[#1e1e21]' : 'bg-white',
        )}
      >
        <span className="flex gap-[3px] px-1.5 pt-1.5">
          {TRAFFIC_LIGHTS.map((c) => (
            <span key={c} className="block h-1 w-1 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </span>
        <span className="flex gap-1.5 px-1.5 pt-2">
          <span className="flex w-[30%] flex-col gap-1">
            <span className="block h-[5px] rounded-[2px] bg-accent" />
            <span className={cn('block h-[3px] w-4/5 rounded-full', line)} />
            <span className={cn('block h-[3px] w-3/5 rounded-full', line)} />
          </span>
          <span className="flex flex-1 flex-col gap-1">
            <span className={cn('block h-[3px] rounded-full', line)} />
            <span className={cn('block h-[3px] w-5/6 rounded-full', line)} />
            <span className={cn('block h-[3px] w-2/3 rounded-full', line)} />
          </span>
        </span>
      </span>
    </span>
  )
}

/** Desktop with a window in the given appearance; "auto" is split down the middle. */
export function AppearancePreview({ mode }: { mode: ThemeMode }) {
  if (mode === 'system') {
    return (
      <>
        <Desktop dark={false} />
        <span className="absolute inset-0 block [clip-path:inset(0_0_0_50%)]">
          <Desktop dark />
        </span>
      </>
    )
  }
  return <Desktop dark={mode === 'dark'} />
}

/* The plates really blur the shapes behind them, so the two materials can be
   compared directly: frosted and fairly opaque vs. clear glass with a lit rim. */
const PLATES: Record<GlassMode, string> = {
  sequoia: cn(
    'bg-[rgb(246_246_248/0.8)] backdrop-blur-[10px] backdrop-saturate-[1.8]',
    'shadow-[inset_0_0.5px_0_rgb(255_255_255/0.8),0_0_0_0.5px_rgb(0_0_0/0.1),0_4px_12px_-2px_rgb(0_0_0/0.3)]',
    'dark:bg-[rgb(38_38_40/0.8)]',
    'dark:shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.14),0_0_0_0.5px_rgb(0_0_0/0.6),0_4px_12px_-2px_rgb(0_0_0/0.5)]',
  ),
  tahoe: cn(
    'bg-white/[0.14] backdrop-blur-[2px] backdrop-brightness-[1.08] backdrop-saturate-[1.9]',
    'shadow-[inset_0_1px_0.5px_rgb(255_255_255/0.9),inset_0_-0.5px_0.5px_rgb(255_255_255/0.45),inset_0_0_10px_-3px_rgb(0_0_0/0.22),0_0_0_0.5px_rgb(0_0_0/0.12),0_4px_12px_-2px_rgb(0_0_0/0.3)]',
    'dark:bg-[rgb(24_24_28/0.3)] dark:backdrop-brightness-[0.92]',
    'dark:shadow-[inset_0_1px_0.5px_rgb(255_255_255/0.3),inset_0_-0.5px_0.5px_rgb(255_255_255/0.12),inset_0_0_10px_-3px_rgb(0_0_0/0.45),0_0_0_0.5px_rgb(0_0_0/0.5),0_4px_12px_-2px_rgb(0_0_0/0.5)]',
  ),
}

export function MaterialPreview({ mode }: { mode: GlassMode }) {
  return (
    <>
      <span className={cn('absolute inset-0 block', SKY_BY_APPEARANCE)}>
        <span className="absolute left-[10%] top-[14%] block h-9 w-9 rounded-full bg-[#ff9f0a]" />
        <span className="absolute bottom-[10%] left-[46%] block h-7 w-7 rotate-12 rounded-[7px] bg-[#ff375f]" />
        <span className="absolute right-[8%] top-[20%] block h-6 w-12 rounded-full bg-[#30d158]" />
      </span>
      <span
        className={cn(
          'absolute inset-x-[14%] inset-y-[24%] flex flex-col justify-center gap-1.5 rounded-[12px] px-3',
          PLATES[mode],
        )}
      >
        <span className="block h-1 w-3/5 rounded-full bg-black/60 dark:bg-white/80" />
        <span className="block h-1 w-2/5 rounded-full bg-black/30 dark:bg-white/45" />
      </span>
    </>
  )
}
