import type { ProgressState, StorageAdapter } from './types'

export const STORAGE_KEY = 'goojee_progress_v1'

const DEFAULT_PROGRESS: ProgressState = {
  tutorialCompleted: false,
  completedIds: [],
}

export function createMemoryStorage(initial: Record<string, string> = {}): StorageAdapter {
  const map = new Map<string, string>(Object.entries(initial))
  return {
    getItem(key) {
      return map.has(key) ? map.get(key)! : null
    },
    setItem(key, value) {
      map.set(key, value)
    },
    removeItem(key) {
      map.delete(key)
    },
  }
}

export function createWxStorage(): StorageAdapter {
  return {
    getItem(key) {
      try {
        const v = wx.getStorageSync(key)
        if (v === '' || v === undefined || v === null) return null
        return typeof v === 'string' ? v : String(v)
      } catch {
        return null
      }
    },
    setItem(key, value) {
      try {
        wx.setStorageSync(key, value)
      } catch {
        // fail closed: 忽略写失败，避免抛到 UI
      }
    },
    removeItem(key) {
      try {
        wx.removeStorageSync(key)
      } catch {
        // ignore
      }
    },
  }
}

function parseProgress(raw: string | null): ProgressState {
  if (!raw) return { ...DEFAULT_PROGRESS, completedIds: [] }
  try {
    const data = JSON.parse(raw) as Partial<ProgressState>
    return {
      tutorialCompleted: Boolean(data.tutorialCompleted),
      completedIds: Array.isArray(data.completedIds)
        ? data.completedIds.filter((x) => typeof x === 'string')
        : [],
    }
  } catch {
    return { ...DEFAULT_PROGRESS, completedIds: [] }
  }
}

export function loadProgress(adapter: StorageAdapter): ProgressState {
  return parseProgress(adapter.getItem(STORAGE_KEY))
}

export function saveProgress(adapter: StorageAdapter, state: ProgressState): void {
  adapter.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function markLevelCompleted(adapter: StorageAdapter, levelId: string): ProgressState {
  const state = loadProgress(adapter)
  if (!state.completedIds.includes(levelId)) {
    state.completedIds = [...state.completedIds, levelId]
  }
  saveProgress(adapter, state)
  return state
}

export function isLevelCompleted(adapter: StorageAdapter, levelId: string): boolean {
  return loadProgress(adapter).completedIds.includes(levelId)
}
