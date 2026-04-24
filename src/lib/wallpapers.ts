export interface WallpaperPreset {
  id: string
  name: string
  url: string
  thumb: string
}

const u = (id: string, w = 2560) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const PRESETS: WallpaperPreset[] = [
  {
    id: 'sonoma-light',
    name: '晨光',
    url: u('photo-1506703719100-a0f3a48c0f86'),
    thumb: u('photo-1506703719100-a0f3a48c0f86', 400),
  },
  {
    id: 'ventura',
    name: '山峦',
    url: u('photo-1464822759023-fed622ff2c3b'),
    thumb: u('photo-1464822759023-fed622ff2c3b', 400),
  },
  {
    id: 'big-sur',
    name: '海岸',
    url: u('photo-1507525428034-b723cf961d3e'),
    thumb: u('photo-1507525428034-b723cf961d3e', 400),
  },
  {
    id: 'dark-sky',
    name: '深空',
    url: u('photo-1534796636912-3b95b3ab5986'),
    thumb: u('photo-1534796636912-3b95b3ab5986', 400),
  },
  {
    id: 'mountain-mist',
    name: '薄雾',
    url: u('photo-1469854523086-cc02fe5d8800'),
    thumb: u('photo-1469854523086-cc02fe5d8800', 400),
  },
  {
    id: 'forest',
    name: '森林',
    url: u('photo-1441974231531-c6227db76b6e'),
    thumb: u('photo-1441974231531-c6227db76b6e', 400),
  },
]

export function randomDailyWallpaper(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `https://picsum.photos/seed/${today}/2560/1440`
}
