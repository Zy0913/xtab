// macOS-style monochrome weather glyphs — use currentColor to blend with glass

interface IconProps {
  size?: number
  className?: string
}

/**
 * Glyphs are drawn slightly oversized in a 36 box so at 18–24px they stay
 * optically legible (macOS weather glyphs read larger than their bounding box).
 */
function CloudPath({ fillOpacity = 0.9 }: { fillOpacity?: number }) {
  return (
    <path
      d="M8.2 24.2a6.2 6.2 0 0 1-1.2-12.3A10.4 10.4 0 0 1 27.2 13.5h.45a5 5 0 0 1 0 10H8.2z"
      fill="currentColor"
      fillOpacity={fillOpacity}
    />
  )
}

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
      <circle cx="18" cy="18" r="7" fill="currentColor" fillOpacity={0.95} />
      <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" opacity={0.88}>
        <line x1="18" y1="3.2" x2="18" y2="6.8" />
        <line x1="18" y1="29.2" x2="18" y2="32.8" />
        <line x1="3.2" y1="18" x2="6.8" y2="18" />
        <line x1="29.2" y1="18" x2="32.8" y2="18" />
        <line x1="7.5" y1="7.5" x2="10" y2="10" />
        <line x1="26" y1="26" x2="28.5" y2="28.5" />
        <line x1="7.5" y1="28.5" x2="10" y2="26" />
        <line x1="26" y1="10" x2="28.5" y2="7.5" />
      </g>
    </svg>
  )
}

export function CloudIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className={className} aria-hidden="true">
      <CloudPath />
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
      <circle cx="12.5" cy="12" r="4.5" fill="currentColor" fillOpacity={0.9} />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity={0.85}>
        <line x1="12.5" y1="4" x2="12.5" y2="6.2" />
        <line x1="4.5" y1="12" x2="6.7" y2="12" />
        <line x1="6.8" y1="6.3" x2="8.3" y2="7.8" />
        <line x1="18.2" y1="6.3" x2="16.7" y2="7.8" />
      </g>
      <path
        d="M10 26a5.2 5.2 0 0 1-1-10.3A8.4 8.4 0 0 1 25 16.5h.35a4.15 4.15 0 0 1 0 8.3H10z"
        fill="currentColor"
        fillOpacity={0.92}
      />
    </svg>
  )
}

export function RainIcon({ size = 24, className }: IconProps) {
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
        d="M8.5 18.2a5.8 5.8 0 0 1-1.1-11.5A9.8 9.8 0 0 1 26 8.8h.45a4.7 4.7 0 0 1 0 9.4H8.5z"
        fill="currentColor"
        fillOpacity={0.9}
      />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.82}>
        <line x1="12" y1="21.5" x2="10.8" y2="27.5" />
        <line x1="18" y1="23" x2="16.8" y2="29" />
        <line x1="24" y1="21.5" x2="22.8" y2="27.5" />
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
        d="M8.5 16a5.8 5.8 0 0 1-1.1-11.5A9.8 9.8 0 0 1 26 6.6h.45a4.7 4.7 0 0 1 0 9.4H8.5z"
        fill="currentColor"
        fillOpacity={0.9}
      />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.82}>
        <line x1="11" y1="18.5" x2="9.4" y2="24.5" />
        <line x1="16.5" y1="19" x2="14.9" y2="25.5" />
        <line x1="22" y1="18.5" x2="20.4" y2="24.5" />
        <line x1="13.5" y1="25.5" x2="12.1" y2="31" />
        <line x1="19.5" y1="26" x2="18.1" y2="31.5" />
      </g>
    </svg>
  )
}

export function SnowIcon({ size = 24, className }: IconProps) {
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
        d="M9 18.5a5.5 5.5 0 0 1-1-11A9.2 9.2 0 0 1 25.5 9.2h.4a4.4 4.4 0 0 1 0 8.8H9z"
        fill="currentColor"
        fillOpacity={0.9}
      />
      <g fill="currentColor" fillOpacity={0.85}>
        <circle cx="12" cy="25" r="1.6" />
        <circle cx="18" cy="28" r="1.6" />
        <circle cx="24" cy="25" r="1.6" />
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
        d="M9 15.5a5.5 5.5 0 0 1-1-11A9.2 9.2 0 0 1 25.5 6.2h.4a4.4 4.4 0 0 1 0 8.8H9z"
        fill="currentColor"
        fillOpacity={0.75}
      />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.8}>
        <line x1="7" y1="21" x2="29" y2="21" />
        <line x1="9" y1="26" x2="27" y2="26" />
        <line x1="11" y1="31" x2="25" y2="31" />
      </g>
    </svg>
  )
}

export function ThunderstormIcon({ size = 24, className }: IconProps) {
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
        d="M9 16.5a5.5 5.5 0 0 1-1-11A9.2 9.2 0 0 1 25.5 7.2h.4a4.4 4.4 0 0 1 0 8.8H9z"
        fill="currentColor"
        fillOpacity={0.9}
      />
      <path
        d="M19.5 16.5 14 24.5h5l-2.5 7.5 8.5-11.5h-4.5l3-4z"
        fill="currentColor"
        fillOpacity={0.95}
      />
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
export function renderWeatherIcon(weatherCode: number, size = 24, className?: string) {
  for (const entry of WEATHER_ICON_MAP) {
    if (weatherCode <= entry.maxCode) {
      const Icon = entry.Icon
      return <Icon size={size} className={className} />
    }
  }
  return <ThunderstormIcon size={size} className={className} />
}
