// macOS-style filled weather icons — natural color palette

interface IconProps {
  size?: number
  className?: string
}

const SUN = '#F5B731'
const CLOUD = '#B0BEC5'
const CLOUD_DARK = '#78909C'
const RAIN = '#64B5F6'
const SNOW = '#E3F2FD'
const BOLT = '#F5B731'

export function SunIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="8" fill={SUN} />
      <g stroke={SUN} strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="1" x2="18" y2="5" />
        <line x1="18" y1="31" x2="18" y2="35" />
        <line x1="6" y1="6" x2="8.8" y2="8.8" />
        <line x1="27.2" y1="27.2" x2="30" y2="30" />
        <line x1="1" y1="18" x2="5" y2="18" />
        <line x1="31" y1="18" x2="35" y2="18" />
        <line x1="6" y1="30" x2="8.8" y2="27.2" />
        <line x1="27.2" y1="8.8" x2="30" y2="6" />
      </g>
    </svg>
  )
}

export function CloudIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className={className} aria-hidden="true">
      <path
        d="M9 28a7 7 0 0 1-1.36-13.88A12 12 0 0 1 31 16.5h.5a5.5 5.5 0 0 1 0 11H9z"
        fill={CLOUD}
      />
    </svg>
  )
}

export function PartlyCloudyIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Sun peeking from behind cloud */}
      <circle cx="13" cy="12" r="5.5" fill={SUN} />
      <g stroke={SUN} strokeWidth="1.8" strokeLinecap="round">
        <line x1="13" y1="2.5" x2="13" y2="5" />
        <line x1="3.5" y1="12" x2="6" y2="12" />
        <line x1="6.2" y1="5.2" x2="8" y2="7" />
        <line x1="19.8" y1="5.2" x2="18" y2="7" />
      </g>
      {/* Cloud in front, covering lower part of sun */}
      <path d="M8 28a6 6 0 0 1-1.17-11.9A9 9 0 0 1 26 17h.5a5 5 0 0 1 0 10H8z" fill={CLOUD} />
    </svg>
  )
}

export function RainIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className={className} aria-hidden="true">
      <path
        d="M8 20a6.5 6.5 0 0 1-1.27-12.88A11 11 0 0 1 29 10.25h.5a5.5 5.5 0 0 1 0 11H8z"
        fill={CLOUD_DARK}
      />
      <g fill={RAIN}>
        <ellipse cx="11" cy="26" rx="1.8" ry="3.5" />
        <ellipse cx="18" cy="29" rx="1.8" ry="3.5" />
        <ellipse cx="25" cy="26" rx="1.8" ry="3.5" />
      </g>
    </svg>
  )
}

export function HeavyRainIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 17a6.5 6.5 0 0 1-1.27-12.88A11 11 0 0 1 29 7.25h.5a5.5 5.5 0 0 1 0 11H8z"
        fill={CLOUD_DARK}
      />
      <g stroke={RAIN} strokeWidth="2.5" strokeLinecap="round">
        <line x1="10" y1="20" x2="8" y2="27" />
        <line x1="18" y1="20" x2="16" y2="27" />
        <line x1="26" y1="20" x2="24" y2="27" />
        <line x1="14" y1="27" x2="12" y2="34" />
        <line x1="22" y1="27" x2="20" y2="34" />
      </g>
    </svg>
  )
}

export function SnowIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className={className} aria-hidden="true">
      <path
        d="M8 20a6.5 6.5 0 0 1-1.27-12.88A11 11 0 0 1 29 10.25h.5a5.5 5.5 0 0 1 0 11H8z"
        fill={CLOUD_DARK}
      />
      <g fill={SNOW}>
        <circle cx="11" cy="26" r="2.2" />
        <circle cx="18" cy="29" r="2.2" />
        <circle cx="25" cy="26" r="2.2" />
      </g>
    </svg>
  )
}

export function FogIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 16a6.5 6.5 0 0 1-1.27-12.88A11 11 0 0 1 29 6.25h.5a5.5 5.5 0 0 1 0 11H8z"
        fill={CLOUD}
      />
      <g stroke={CLOUD} strokeWidth="2.5" strokeLinecap="round">
        <line x1="5" y1="21" x2="31" y2="21" />
        <line x1="8" y1="26" x2="28" y2="26" />
        <line x1="11" y1="31" x2="25" y2="31" />
      </g>
    </svg>
  )
}

export function ThunderstormIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className={className} aria-hidden="true">
      <path
        d="M8 17a6.5 6.5 0 0 1-1.27-12.88A11 11 0 0 1 29 7.25h.5a5.5 5.5 0 0 1 0 11H8z"
        fill={CLOUD_DARK}
      />
      <path d="M20 16l-6 12h6l-4 9 10-14h-6l4-7z" fill={BOLT} />
    </svg>
  )
}

const WEATHER_ICON_MAP = [
  { maxCode: 0, Icon: SunIcon },
  { maxCode: 3, Icon: PartlyCloudyIcon },
  { maxCode: 48, Icon: FogIcon },
  { maxCode: 67, Icon: RainIcon },
  { maxCode: 77, Icon: SnowIcon },
  { maxCode: 82, Icon: HeavyRainIcon },
  { maxCode: 99, Icon: ThunderstormIcon },
] as const

// eslint-disable-next-line react-refresh/only-export-components
export function renderWeatherIcon(weatherCode: number, size = 24) {
  for (const entry of WEATHER_ICON_MAP) {
    if (weatherCode <= entry.maxCode) {
      const Icon = entry.Icon
      return <Icon size={size} />
    }
  }
  return <ThunderstormIcon size={size} />
}
