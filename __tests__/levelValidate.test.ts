import {
  areAllRegionsConnected,
  countSolutions,
  findSingletonCell,
  hasSingletonRegion,
  hasUniqueSolution,
  isRegionConnected,
  validateLevel,
} from '../utils/levelValidate'
import type { Level } from '../utils/types'

describe('levelValidate uniqueness helpers', () => {
  const uniqueWithSingleton: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 2, 1],
    [2, 2, 2, 2],
    [2, 3, 3, 3],
  ]

  test('hasSingletonRegion / findSingletonCell', () => {
    expect(hasSingletonRegion(uniqueWithSingleton)).toBe(true)
    expect(findSingletonCell(uniqueWithSingleton)).toEqual({
      r: 1,
      c: 3,
      regionId: 1,
    })
  })

  test('regions are 4-connected', () => {
    expect(areAllRegionsConnected(uniqueWithSingleton)).toBe(true)
    expect(isRegionConnected(uniqueWithSingleton, 1)).toBe(true)
  })

  test('detects disconnected region', () => {
    const disconnected = [
      [0, 1, 0, 1],
      [0, 1, 2, 1],
      [2, 2, 2, 3],
      [2, 3, 3, 3],
    ]
    expect(isRegionConnected(disconnected, 0)).toBe(false)
    expect(areAllRegionsConnected(disconnected)).toBe(false)
  })

  test('hasUniqueSolution true', () => {
    expect(hasUniqueSolution(uniqueWithSingleton)).toBe(true)
    expect(countSolutions(uniqueWithSingleton, 2)).toBe(1)
  })

  test('validateLevel rejects missing singleton', () => {
    const level: Level = {
      id: 'bad',
      name: 'bad',
      kind: 'normal',
      difficulty: 1,
      size: 4,
      regions: [
        [0, 0, 1, 1],
        [0, 0, 1, 1],
        [2, 2, 3, 3],
        [2, 2, 3, 3],
      ],
    }
    const result = validateLevel(level)
    expect(result.hasSingleton).toBe(false)
    expect(result.errors).toContain('missing singleton clue')
    expect(result.ok).toBe(false)
  })

  test('validateLevel rejects disconnected regions', () => {
    const level: Level = {
      id: 'disc',
      name: 'disc',
      kind: 'normal',
      difficulty: 1,
      size: 4,
      regions: [
        [0, 1, 0, 1],
        [0, 1, 2, 1],
        [2, 2, 2, 3],
        [2, 3, 3, 3],
      ],
    }
    const result = validateLevel(level)
    expect(result.errors.some((e) => e.startsWith('disconnected regions:'))).toBe(
      true,
    )
    expect(result.ok).toBe(false)
  })

  test('validateLevel rejects tutorial size > 4', () => {
    const level: Level = {
      id: 'tut-big',
      name: 'too big',
      kind: 'tutorial',
      difficulty: 0,
      size: 5,
      regions: [
        [0, 0, 0, 0, 2],
        [0, 0, 1, 2, 2],
        [3, 3, 3, 2, 2],
        [3, 3, 3, 4, 2],
        [3, 3, 4, 4, 4],
      ],
      tips: [{ text: 'x' }],
    }
    const result = validateLevel(level)
    expect(result.errors).toContain('tutorial size must be <= 4')
  })

  test('validateLevel accepts good tutorial', () => {
    const level: Level = {
      id: 'tut-ok',
      name: 'ok',
      kind: 'tutorial',
      difficulty: 0,
      size: 4,
      regions: uniqueWithSingleton,
      tips: [{ text: 'go', highlight: { r: 1, c: 3 }, expect: 'place' }],
    }
    const result = validateLevel(level)
    expect(result.ok).toBe(true)
    expect(result.solutionCount).toBe(1)
  })
})
