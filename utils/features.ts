import type { StorageAdapter } from './types'

/**
 * 功能解锁位。当前全员可用；日后在此检查 VIP / 成就。
 */
export function isAutoMarkDeadCellsUnlocked(_adapter: StorageAdapter): boolean {
  return true
}

export function canUseAutoMarkDeadCells(
  adapter: StorageAdapter,
  autoMarkEnabled: boolean,
): boolean {
  return isAutoMarkDeadCellsUnlocked(adapter) && autoMarkEnabled
}
