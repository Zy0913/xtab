import { useEffect, useState } from 'react'

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

// Seconds tick once per second; isolating them lets the rest of the clock —
// and the unchanging date label — skip the per-second reconciliation pass.
function Seconds() {
  const [ss, setSs] = useState(() => pad(new Date().getSeconds()))

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const tick = () => setSs(pad(new Date().getSeconds()))
    const start = () => {
      tick()
      timer = setInterval(tick, 1000)
    }
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    }
    const onVisibility = () => {
      stop()
      if (!document.hidden) start()
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <span
      className="ml-1 self-end pb-1.5 text-xl font-light tabular-nums tracking-tight sm:text-2xl"
      style={{ color: 'var(--text-primary)', opacity: 0.34 }}
    >
      {ss}
    </span>
  )
}

export function Clock() {
  const [minute, setMinute] = useState(() => readMinute(new Date()))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const schedule = () => {
      const now = new Date()
      const delay = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds())
      timer = setTimeout(() => {
        setMinute(readMinute(new Date()))
        schedule()
      }, delay)
    }
    const stop = () => {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    }
    const onVisibility = () => {
      if (document.hidden) {
        stop()
      } else {
        setMinute(readMinute(new Date()))
        schedule()
      }
    }

    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div
      className="flex h-full flex-col items-center justify-center text-center"
      role="timer"
      aria-live="off"
      aria-label={`${minute.hh}:${minute.mm}，${minute.month}月${minute.day}日 ${minute.weekday}`}
    >
      <div
        className="text-shadow-wallpaper flex items-baseline font-extralight tabular-nums tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="text-display">{minute.hh}</span>
        <span
          className="animate-colon-blink mx-0.5 text-display font-extralight"
          style={{ color: 'var(--text-primary)' }}
          aria-hidden
        >
          :
        </span>
        <span className="text-display">{minute.mm}</span>
        <Seconds />
      </div>

      {/* Ceremonial date — compact so the hero block doesn't eat the viewport */}
      <div
        className="text-shadow-wallpaper mt-2.5 flex flex-col items-center gap-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        <p className="text-sm font-light tracking-[0.2em] sm:text-[15px]" style={{ opacity: 0.78 }}>
          {minute.month}
          <span className="mx-1 opacity-50">月</span>
          {minute.day}
          <span className="ml-1 opacity-50">日</span>
        </p>
        <div className="flex items-center gap-2.5" style={{ opacity: 0.5 }}>
          <span className="h-px w-5 bg-current opacity-40" aria-hidden />
          <span className="text-micro font-medium tracking-[0.28em]">{minute.weekday}</span>
          <span className="h-px w-5 bg-current opacity-40" aria-hidden />
        </div>
      </div>
    </div>
  )
}
