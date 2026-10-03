import { LEVELS } from '../data/levels'
import { getNextNormalId, getTutorialLevels } from '../utils/tutorialFlow'

describe('tutorial metadata', () => {
  test('exactly 3 tutorials in order', () => {
    const tutorials = getTutorialLevels(LEVELS)
    expect(tutorials.map((t) => t.id)).toEqual(['tut-1', 'tut-2', 'tut-3'])
  })

  test('each tutorial has valid tips and size <= 4', () => {
    for (const level of getTutorialLevels(LEVELS)) {
      expect(level.size).toBeLessThanOrEqual(4)
      expect(level.tips && level.tips.length >= 1).toBe(true)
      for (const tip of level.tips ?? []) {
        expect(tip.text.length).toBeGreaterThan(0)
        if (tip.highlight) {
          expect(tip.highlight.r).toBeGreaterThanOrEqual(0)
          expect(tip.highlight.c).toBeGreaterThanOrEqual(0)
          expect(tip.highlight.r).toBeLessThan(level.size)
          expect(tip.highlight.c).toBeLessThan(level.size)
        }
      }
    }
  })

  test('getNextNormalId walks normal levels and ends at last', () => {
    expect(getNextNormalId(LEVELS, 'n-5-1')).toBe('n-5-2')
    expect(getNextNormalId(LEVELS, 'n-8-1')).toBe('n-8-2')
    expect(getNextNormalId(LEVELS, 'n-9-6')).toBeNull()
    expect(getNextNormalId(LEVELS, 'missing')).toBeNull()
  })
})
