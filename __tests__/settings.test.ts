import { isAutoMarkDeadCellsUnlocked, canUseAutoMarkDeadCells } from '../utils/features'
import {
  loadSettings,
  setAutoMarkDeadCells,
  setColorWeakMode,
} from '../utils/settings'
import { createMemoryStorage } from '../utils/storage'

describe('settings', () => {
  test('defaults autoMarkDeadCells and colorWeakMode to false', () => {
    const adapter = createMemoryStorage()
    const settings = loadSettings(adapter)
    expect(settings.autoMarkDeadCells).toBe(false)
    expect(settings.colorWeakMode).toBe(false)
  })

  test('setAutoMarkDeadCells persists', () => {
    const adapter = createMemoryStorage()
    setAutoMarkDeadCells(adapter, true)
    expect(loadSettings(adapter).autoMarkDeadCells).toBe(true)
    setAutoMarkDeadCells(adapter, false)
    expect(loadSettings(adapter).autoMarkDeadCells).toBe(false)
  })

  test('unlock stub is true for all players', () => {
    const adapter = createMemoryStorage()
    expect(isAutoMarkDeadCellsUnlocked(adapter)).toBe(true)
  })

  test('canUseAutoMarkDeadCells requires both unlock and setting', () => {
    const adapter = createMemoryStorage()
    expect(canUseAutoMarkDeadCells(adapter, false)).toBe(false)
    expect(canUseAutoMarkDeadCells(adapter, true)).toBe(true)
  })

  test('setColorWeakMode persists', () => {
    const adapter = createMemoryStorage()
    setColorWeakMode(adapter, true)
    expect(loadSettings(adapter).colorWeakMode).toBe(true)
    setColorWeakMode(adapter, false)
    expect(loadSettings(adapter).colorWeakMode).toBe(false)
  })
})
