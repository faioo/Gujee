import { colorsForSize } from '../utils/colors'

describe('colorsForSize', () => {
  test('default and color-weak palettes have the same length', () => {
    for (const size of [4, 5, 6, 7, 8]) {
      expect(colorsForSize(size, false)).toHaveLength(size)
      expect(colorsForSize(size, true)).toHaveLength(size)
    }
  })

  test('color-weak palette differs from the default pastel set', () => {
    expect(colorsForSize(5, true)).not.toEqual(colorsForSize(5, false))
  })
})
