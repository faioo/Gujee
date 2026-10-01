import { cloneBoard, createEmptyBoard, getConflicts, isSolved } from './rules'
import type { Board, Level, TutorialTip } from './types'

export interface LevelValidationResult {
  ok: boolean
  errors: string[]
  hasSolution: boolean
}

function validateStructure(level: Level): string[] {
  const errors: string[] = []
  const { size, regions, id, name, kind, difficulty, tips } = level

  if (!id) errors.push('missing id')
  if (!name) errors.push('missing name')
  if (!Number.isInteger(size) || size < 2) errors.push('invalid size')
  if (regions.length !== size) errors.push('regions row count mismatch')

  const seen = new Set<number>()
  for (let r = 0; r < regions.length; r++) {
    if (regions[r].length !== size) {
      errors.push(`row ${r} length mismatch`)
      continue
    }
    for (let c = 0; c < regions[r].length; c++) {
      const v = regions[r][c]
      if (!Number.isInteger(v) || v < 0 || v >= size) {
        errors.push(`invalid region at (${r},${c}): ${v}`)
      } else {
        seen.add(v)
      }
    }
  }

  for (let i = 0; i < size; i++) {
    if (!seen.has(i)) errors.push(`missing region id ${i}`)
  }

  if (kind === 'tutorial') {
    if (difficulty !== 0) errors.push('tutorial difficulty must be 0')
    if (!tips || tips.length < 1) errors.push('tutorial requires tips')
    if (tips) {
      for (let i = 0; i < tips.length; i++) {
        errors.push(...validateTip(tips[i], size, i))
      }
    }
  }

  return errors
}

function validateTip(tip: TutorialTip, size: number, index: number): string[] {
  const errors: string[] = []
  if (!tip.text) errors.push(`tip[${index}] missing text`)
  if (tip.highlight) {
    const { r, c } = tip.highlight
    if (r < 0 || c < 0 || r >= size || c >= size) {
      errors.push(`tip[${index}] highlight out of bounds`)
    }
  }
  return errors
}

/** 回溯求解：是否至少存在一解 */
export function hasSolution(regions: number[][]): boolean {
  const n = regions.length
  const board = createEmptyBoard(n)
  const usedCols = new Array(n).fill(false)
  const usedRegions = new Array(n).fill(false)

  const dfs = (row: number): boolean => {
    if (row === n) {
      return isSolved(board, regions)
    }

    for (let c = 0; c < n; c++) {
      if (usedCols[c]) continue
      const regionId = regions[row][c]
      if (usedRegions[regionId]) continue

      board[row][c] = 'place'
      const conflicts = getConflicts(board, regions).cells
      const selfConflict = conflicts.some((p) => p.r === row && p.c === c)
      if (!selfConflict) {
        usedCols[c] = true
        usedRegions[regionId] = true
        if (dfs(row + 1)) return true
        usedCols[c] = false
        usedRegions[regionId] = false
      }
      board[row][c] = 'empty'
    }
    return false
  }

  return dfs(0)
}

export function validateLevel(level: Level): LevelValidationResult {
  const errors = validateStructure(level)
  if (errors.length > 0) {
    return { ok: false, errors, hasSolution: false }
  }
  const solvable = hasSolution(level.regions)
  if (!solvable) errors.push('no solution')
  return { ok: errors.length === 0, errors, hasSolution: solvable }
}

/** 供测试：给定放置坐标构造盘面 */
export function boardFromPlacements(
  size: number,
  placements: Array<{ r: number; c: number }>,
): Board {
  const board = createEmptyBoard(size)
  for (const p of placements) {
    board[p.r][p.c] = 'place'
  }
  return board
}

export function applyMarks(board: Board, marks: Array<{ r: number; c: number }>): Board {
  const next = cloneBoard(board)
  for (const m of marks) {
    next[m.r][m.c] = 'mark'
  }
  return next
}
