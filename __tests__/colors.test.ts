import { REGION_COLORS, colorsForSize } from '../utils/colors'

describe('colorsForSize', () => {
  test('returns size colors in both modes', () => {
    for (const size of [4, 5, 6, 7, 8, 10, 12, 14]) {
      expect(colorsForSize(size, false)).toHaveLength(size)
      expect(colorsForSize(size, true)).toHaveLength(size)
    }
  })

  test('color-weak mode keeps the pastel palette', () => {
    expect(colorsForSize(8, true)).toEqual(colorsForSize(8, false))
  })

  test('pastel palette has 12 unique colors and wraps beyond that', () => {
    expect(REGION_COLORS).toHaveLength(12)
    expect(new Set(REGION_COLORS).size).toBe(12)
    expect(colorsForSize(14, true)[12]).toBe(REGION_COLORS[0])
    expect(colorsForSize(14, true)[13]).toBe(REGION_COLORS[1])
  })
})
