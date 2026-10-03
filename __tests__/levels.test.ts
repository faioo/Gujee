import { LEVELS } from '../data/levels'
import {
  areAllRegionsConnected,
  countSolutions,
  hasSingletonRegion,
  validateLevel,
} from '../utils/levelValidate'

describe('levels', () => {
  test('every level is unique, connected, solvable, and has singleton clue', () => {
    for (const level of LEVELS) {
      const result = validateLevel(level)
      expect(result.errors).toEqual([])
      expect(result.ok).toBe(true)
      expect(result.hasSolution).toBe(true)
      expect(result.solutionCount).toBe(1)
      expect(result.hasSingleton).toBe(true)
      expect(hasSingletonRegion(level.regions)).toBe(true)
      expect(areAllRegionsConnected(level.regions)).toBe(true)
      expect(countSolutions(level.regions, 2)).toBe(1)
    }
  })

  test('has expected counts, sizes, and difficulty curve', () => {
    const tutorials = LEVELS.filter((l) => l.kind === 'tutorial')
    const normals = LEVELS.filter((l) => l.kind === 'normal')
    expect(tutorials.length).toBe(3)
    expect(normals.length).toBe(18)
    for (const t of tutorials) {
      expect(t.size).toBeLessThanOrEqual(4)
    }
    expect(normals.map((l) => l.size)).toEqual([
      5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10,
    ])
    expect(normals.every((l) => l.size <= 10)).toBe(true)
    for (const n of normals) {
      if (n.size >= 9) expect(n.difficulty).toBe(3)
    }
  })
})
