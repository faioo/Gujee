import type { GameSettings, StorageAdapter } from './types'

export const SETTINGS_KEY = 'goojee_settings_v1'

const DEFAULT_SETTINGS: GameSettings = {
  autoMarkDeadCells: false,
}

export function defaultSettings(): GameSettings {
  return { ...DEFAULT_SETTINGS }
}

function parseSettings(raw: string | null): GameSettings {
  const base = defaultSettings()
  if (!raw) return base
  try {
    const data = JSON.parse(raw) as Partial<GameSettings>
    return {
      autoMarkDeadCells: Boolean(data.autoMarkDeadCells),
    }
  } catch {
    return base
  }
}

export function loadSettings(adapter: StorageAdapter): GameSettings {
  return parseSettings(adapter.getItem(SETTINGS_KEY))
}

export function saveSettings(adapter: StorageAdapter, settings: GameSettings): void {
  adapter.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function setAutoMarkDeadCells(
  adapter: StorageAdapter,
  enabled: boolean,
): GameSettings {
  const settings = loadSettings(adapter)
  settings.autoMarkDeadCells = enabled
  saveSettings(adapter, settings)
  return settings
}
