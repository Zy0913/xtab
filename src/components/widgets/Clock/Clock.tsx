import { useEffect, useState } from 'react'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

const WEEKDAYS_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface MinutePayload {
  hh: string
  mm: string
  dateLabel: string
}

function readMinute(d: Date): MinutePayload {
  return {
    hh: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    dateLabel: `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · ${WEEKDAYS_CN[d.getDay()]}`,
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
    <span className="ml-2 text-3xl font-light" style={{ color: 'var(--text-on-dark)', opacity: 0.45 }}>
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
    <div className="flex h-full flex-col items-center justify-center text-center" role="timer" aria-live="off" aria-label="时钟">
      <div className="flex items-baseline gap-1.5 font-extralight tabular-nums tracking-tight text-shadow-wallpaper"
        style={{ color: 'var(--text-on-dark)' }}>
        <span className="text-8xl">{minute.hh}</span>
        <span className="text-7xl animate-pulse" style={{ color: 'var(--text-on-dark)', opacity: 0.55 }}>:</span>
        <span className="text-8xl">{minute.mm}</span>
        <Seconds />
      </div>
      <p className="mt-3 text-sm text-shadow-wallpaper" style={{ color: 'var(--text-on-dark)', opacity: 0.78 }}>
        {minute.dateLabel}
      </p>
    </div>
  )
}
