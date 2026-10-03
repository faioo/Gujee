/** 咕叽咕叽 / Goojee 核心类型 */

export type CellState = 'empty' | 'mark' | 'place' | 'wrong'
export type LevelKind = 'tutorial' | 'normal'
export type Difficulty = 0 | 1 | 2 | 3

export interface CellPos {
  r: number
  c: number
}

export interface TutorialTip {
  text: string
  highlight?: CellPos
  expect?: CellState
}

export interface Level {
  id: string
  name: string
  kind: LevelKind
  size: number
  regions: number[][]
  difficulty: Difficulty
  tips?: TutorialTip[]
}

export type Board = CellState[][]

export interface ConflictSet {
  cells: CellPos[]
}

export interface ProgressState {
  tutorialCompleted: boolean
  completedIds: string[]
}

export interface GameSettings {
  autoMarkDeadCells: boolean
  colorWeakMode: boolean
}

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
