import { COLOR_WEAK_PALETTE, REGION_COLORS, colorsForSize } from '../utils/colors'

describe('colorsForSize', () => {
  test('default and color-weak palettes have the same length', () => {
    for (const size of [4, 5, 6, 7, 8, 10, 12, 14]) {
      expect(colorsForSize(size, false)).toHaveLength(size)
      expect(colorsForSize(size, true)).toHaveLength(size)
    }
  })

  test('color-weak palette differs from the default pastel set', () => {
    expect(colorsForSize(5, true)).not.toEqual(colorsForSize(5, false))
  })

  test('palettes have 12 unique colors and wrap beyond that', () => {
    expect(REGION_COLORS).toHaveLength(12)
    expect(COLOR_WEAK_PALETTE).toHaveLength(12)
    expect(new Set(REGION_COLORS).size).toBe(12)
    expect(new Set(COLOR_WEAK_PALETTE).size).toBe(12)
    expect(colorsForSize(14, true)[12]).toBe(COLOR_WEAK_PALETTE[0])
    expect(colorsForSize(14, true)[13]).toBe(COLOR_WEAK_PALETTE[1])
  })
})
