import { describe, expect, it } from 'vitest'
import type { WidgetLayout } from '@/types/widget'
import { centerLastRow, generateStackedLayout } from './stackLayout'

const sample: WidgetLayout[] = [
  { i: 'clock', x: 0, y: 0, w: 12, h: 2 },
  { i: 'search', x: 0, y: 2, w: 12, h: 1 },
  { i: 'weather', x: 0, y: 5, w: 4, h: 3 },
  { i: 'todo', x: 4, y: 5, w: 4, h: 3 },
]

const pick = (items: WidgetLayout[]) => items.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))

describe('generateStackedLayout', () => {
  it('keeps wallpaper widgets full width and pairs cards at 8 columns', () => {
    expect(pick(generateStackedLayout(sample, 8))).toEqual([
      { i: 'clock', x: 0, y: 0, w: 8, h: 2 },
      { i: 'search', x: 0, y: 2, w: 8, h: 1 },
      { i: 'weather', x: 0, y: 3, w: 4, h: 3 },
      { i: 'todo', x: 4, y: 3, w: 4, h: 3 },
    ])
  })

  it('centres a lone last card instead of stretching it', () => {
    const onlyWeather = sample.filter((item) => item.i !== 'todo')
    const stacked = pick(generateStackedLayout(onlyWeather, 8))
    expect(stacked[stacked.length - 1]).toEqual({
      i: 'weather',
      x: 2,
      y: 3,
      w: 4,
      h: 3,
    })
  })

  it('stacks every card full width below 8 columns', () => {
    expect(pick(generateStackedLayout(sample, 4)).slice(2)).toEqual([
      { i: 'weather', x: 0, y: 3, w: 4, h: 3 },
      { i: 'todo', x: 0, y: 6, w: 4, h: 3 },
    ])
  })

  it('gives a widget the rows its content needs and moves the rest down', () => {
    const withShortcuts: WidgetLayout[] = [
      ...sample.slice(0, 2),
      { i: 'shortcuts', x: 0, y: 3, w: 12, h: 2 },
      ...sample.slice(2),
    ]
    expect(pick(generateStackedLayout(withShortcuts, 4, { shortcuts: 3 })).slice(2)).toEqual([
      { i: 'shortcuts', x: 0, y: 3, w: 4, h: 3 },
      { i: 'weather', x: 0, y: 6, w: 4, h: 3 },
      { i: 'todo', x: 0, y: 9, w: 4, h: 3 },
    ])
  })

  it('never makes a widget shorter than its desktop height', () => {
    expect(pick(generateStackedLayout(sample, 4, { clock: 1 }))[0]).toEqual({
      i: 'clock',
      x: 0,
      y: 0,
      w: 4,
      h: 2,
    })
  })

  it('follows the desktop reading order, not array order', () => {
    const shuffled = [sample[3], sample[1], sample[2], sample[0]]
    expect(generateStackedLayout(shuffled, 4).map((item) => item.i)).toEqual([
      'clock',
      'search',
      'weather',
      'todo',
    ])
  })
})

describe('centerLastRow', () => {
  it('centres a lone card', () => {
    const onlyWeather = sample.filter((item) => item.i !== 'todo')
    expect(centerLastRow(onlyWeather).find((item) => item.i === 'weather')).toMatchObject({
      x: 4,
      w: 4,
    })
  })

  it('packs and centres cards that leave a gap', () => {
    const next = centerLastRow([
      sample[0],
      { i: 'weather', x: 0, y: 5, w: 4, h: 3 },
      { i: 'bookmarks', x: 8, y: 5, w: 4, h: 3 },
    ])
    expect(next.map(({ i, x }) => ({ i, x }))).toEqual([
      { i: 'clock', x: 0 },
      { i: 'weather', x: 2 },
      { i: 'bookmarks', x: 6 },
    ])
  })

  it('leaves a full row alone', () => {
    const full: WidgetLayout[] = [...sample, { i: 'bookmarks', x: 8, y: 5, w: 4, h: 3 }]
    expect(centerLastRow(full)).toEqual(full)
  })
})
