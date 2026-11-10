import { useCallback, useEffect, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

const WEEKDAYS_CN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

interface MinutePayload {
  hh: string
  mm: string
  month: number
  day: number
  weekday: string
}

function readMinute(d: Date): MinutePayload {
  return {
    hh: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    month: d.getMonth() + 1,
    day: d.getDate(),
    weekday: WEEKDAYS_CN[d.getDay()],
  }
}

/**
 * Calls `onTick` on every boundary of `periodMs` (each second, each minute).
 * Paused while the tab is hidden; catches up as soon as it is shown again.
 * `onTick` must be stable.
 */
function useAlignedTick(periodMs: number, onTick: () => void) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const schedule = () => {
      timer = setTimeout(
        () => {
          onTick()
          schedule()
        },
        periodMs - (Date.now() % periodMs),
      )
    }
    const stop = () => {
      if (timer !== null) clearTimeout(timer)
      timer = null
    }
    const onVisibility = () => {
      stop()
      if (!document.hidden) {
        onTick()
        schedule()
      }
    }

    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [periodMs, onTick])
}

// Seconds re-render on their own, so the rest of the clock only updates once
// a minute.
function Seconds() {
  const [ss, setSs] = useState(() => pad(new Date().getSeconds()))
  const tick = useCallback(() => setSs(pad(new Date().getSeconds())), [])
  useAlignedTick(1000, tick)
  return (
    <span className="ml-1.5 text-[0.36em] font-medium tracking-normal text-wp-secondary">{ss}</span>
  )
}

/**
 * The lock-screen clock of macOS: the date sits above a large time, set
 * straight on the wallpaper. The colon stays still, as it does on the Mac.
 */
export function Clock() {
  const showSeconds = useSettingsStore((s) => s.showSeconds)
  const [minute, setMinute] = useState(() => readMinute(new Date()))
  const tick = useCallback(() => setMinute(readMinute(new Date())), [])
  useAlignedTick(60_000, tick)

  return (
    <div
      className="text-shadow-wallpaper flex h-full select-none flex-col items-center justify-center text-center"
      role="timer"
      aria-live="off"
      aria-label={`${minute.hh}:${minute.mm}，${minute.month}月${minute.day}日 ${minute.weekday}`}
    >
      <p className="text-title font-semibold text-wp-secondary">
        {minute.month}月{minute.day}日 {minute.weekday}
      </p>
      <p className="mt-0.5 flex items-baseline text-display font-semibold tabular-nums text-wp">
        {/* One text run, so SF Pro centres the colon between the digits. */}
        <span>
          {minute.hh}:{minute.mm}
        </span>
        {showSeconds && <Seconds />}
      </p>
    </div>
  )
}
