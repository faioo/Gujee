import { createMemoryStorage, loadProgress } from '../utils/storage'
import {
  completeTutorial,
  onTutorialLevelSolved,
  shouldForceTutorial,
  skipTutorial,
} from '../utils/tutorialFlow'
import { LEVELS } from '../data/levels'
import { markLevelCompleted } from '../utils/storage'

describe('progress / tutorial flow', () => {
  test('force tutorial when incomplete', () => {
    const adapter = createMemoryStorage()
    expect(shouldForceTutorial(adapter)).toBe(true)
  })

  test('skip tutorial completes flag', () => {
    const adapter = createMemoryStorage()
    skipTutorial(adapter)
    expect(loadProgress(adapter).tutorialCompleted).toBe(true)
    expect(shouldForceTutorial(adapter)).toBe(false)
  })

  test('completing all tutorials sets flag', () => {
    const adapter = createMemoryStorage()
    const tutorials = LEVELS.filter((l) => l.kind === 'tutorial')
    let finished = false
    for (const t of tutorials) {
      const result = onTutorialLevelSolved(adapter, LEVELS, t.id)
      finished = result.tutorialJustFinished
    }
    expect(finished).toBe(true)
    expect(loadProgress(adapter).tutorialCompleted).toBe(true)
    expect(shouldForceTutorial(adapter)).toBe(false)
  })

  test('completeTutorial helper', () => {
    const adapter = createMemoryStorage()
    completeTutorial(adapter)
    expect(shouldForceTutorial(adapter)).toBe(false)
  })

  test('markLevelCompleted is idempotent', () => {
    const adapter = createMemoryStorage()
    markLevelCompleted(adapter, 'n-5-1')
    markLevelCompleted(adapter, 'n-5-1')
    expect(loadProgress(adapter).completedIds).toEqual(['n-5-1'])
  })
})
