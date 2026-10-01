import { LEVELS } from '../data/levels'
import { validateLevel } from '../utils/levelValidate'

describe('levels', () => {
  test('every level validates and is solvable', () => {
    for (const level of LEVELS) {
      const result = validateLevel(level)
      expect(result.errors).toEqual([])
      expect(result.ok).toBe(true)
      expect(result.hasSolution).toBe(true)
    }
  })

  test('has expected counts', () => {
    const tutorials = LEVELS.filter((l) => l.kind === 'tutorial')
    const normals = LEVELS.filter((l) => l.kind === 'normal')
    expect(tutorials.length).toBe(3)
    expect(normals.length).toBeGreaterThanOrEqual(10)
  })
})
