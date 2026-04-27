import { useEffect, useState } from 'react'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

const WEEKDAYS_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    const start = () => {
      setNow(new Date())
      timer = setInterval(() => setNow(new Date()), 1000)
    }
    const stop = () => clearInterval(timer)

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

  const hh = pad(now.getHours())
  const mm = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  const dateLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${WEEKDAYS_CN[now.getDay()]}`

  return (
    <div className="flex h-full flex-col items-center justify-center text-center" role="timer" aria-live="off" aria-label="时钟">
      <div className="flex items-baseline gap-1.5 font-extralight tabular-nums tracking-tight text-shadow-wallpaper"
        style={{ color: 'var(--text-on-dark)' }}>
        <span className="text-8xl">{hh}</span>
        <span className="text-7xl animate-pulse" style={{ color: 'var(--text-on-dark)', opacity: 0.55 }}>:</span>
        <span className="text-8xl">{mm}</span>
        <span className="ml-2 text-3xl font-light" style={{ color: 'var(--text-on-dark)', opacity: 0.45 }}>{ss}</span>
      </div>
      <p className="mt-3 text-sm text-shadow-wallpaper" style={{ color: 'var(--text-on-dark)', opacity: 0.78 }}>
        {dateLabel}
      </p>
    </div>
  )
}
