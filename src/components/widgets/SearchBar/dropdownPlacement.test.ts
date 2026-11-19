import { describe, expect, it, vi } from 'vitest'
import { shouldOpenUpward } from './dropdownPlacement'

function mockAnchor(top: number, bottom: number): HTMLElement {
  const el = document.createElement('div')
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom,
    left: 0,
    right: 100,
    width: 100,
    height: bottom - top,
    x: 0,
    y: top,
    toJSON: () => ({}),
  })
  return el
}

describe('shouldOpenUpward', () => {
  it('returns false when anchor is missing or space below is sufficient', () => {
    expect(shouldOpenUpward(null)).toBe(false)
    vi.stubGlobal('innerHeight', 800)
    expect(shouldOpenUpward(mockAnchor(100, 152), 240)).toBe(false)
  })

  it('returns true when space below is tight and space above is larger', () => {
    vi.stubGlobal('innerHeight', 800)
    expect(shouldOpenUpward(mockAnchor(680, 732), 240)).toBe(true)
  })

  it('stays downward when space above is even smaller than below', () => {
    vi.stubGlobal('innerHeight', 300)
    expect(shouldOpenUpward(mockAnchor(40, 180), 240)).toBe(false)
  })
})
