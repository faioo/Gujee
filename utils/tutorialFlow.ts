import {
  loadProgress,
  markLevelCompleted,
  saveProgress,
} from './storage'
import type { Level, StorageAdapter } from './types'

export function shouldForceTutorial(adapter: StorageAdapter): boolean {
  return !loadProgress(adapter).tutorialCompleted
}

export function skipTutorial(adapter: StorageAdapter): void {
  const state = loadProgress(adapter)
  state.tutorialCompleted = true
  saveProgress(adapter, state)
}

export function completeTutorial(adapter: StorageAdapter): void {
  skipTutorial(adapter)
}

export function resetTutorial(adapter: StorageAdapter): void {
  const state = loadProgress(adapter)
  state.tutorialCompleted = false
  saveProgress(adapter, state)
}

export function getTutorialLevels(levels: Level[]): Level[] {
  return levels.filter((l) => l.kind === 'tutorial')
}

export function getNormalLevels(levels: Level[]): Level[] {
  return levels.filter((l) => l.kind === 'normal')
}

export function getNextTutorialId(
  levels: Level[],
  currentId: string,
): string | null {
  const tutorials = getTutorialLevels(levels)
  const idx = tutorials.findIndex((l) => l.id === currentId)
  if (idx < 0) return null
  if (idx + 1 >= tutorials.length) return null
  return tutorials[idx + 1].id
}

/**
 * 教学关通关后的导航决策。
 * - 还有下一教学关 → 返回其 id
 * - 已是最后一关 → 标记 tutorialCompleted，返回 null（应去关卡列表）
 */
export function onTutorialLevelSolved(
  adapter: StorageAdapter,
  levels: Level[],
  currentId: string,
): { nextTutorialId: string | null; tutorialJustFinished: boolean } {
  markLevelCompleted(adapter, currentId)
  const next = getNextTutorialId(levels, currentId)
  if (next) {
    return { nextTutorialId: next, tutorialJustFinished: false }
  }
  completeTutorial(adapter)
  return { nextTutorialId: null, tutorialJustFinished: true }
}

export function findLevel(levels: Level[], id: string): Level | undefined {
  return levels.find((l) => l.id === id)
}

export function getFirstTutorialId(levels: Level[]): string | null {
  const tutorials = getTutorialLevels(levels)
  return tutorials.length > 0 ? tutorials[0].id : null
}
