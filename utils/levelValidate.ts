import { cloneBoard, createEmptyBoard, getConflicts, isSolved } from './rules'
import type { Board, Level, TutorialTip } from './types'

export interface LevelValidationResult {
  ok: boolean
  errors: string[]
  hasSolution: boolean
  solutionCount: number
  hasSingleton: boolean
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
    if (size > 4) errors.push('tutorial size must be <= 4')
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

/** 各区域格子数；返回 size 映射 */
export function regionSizes(regions: number[][]): number[] {
  const n = regions.length
  const sizes = new Array(n).fill(0)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      sizes[regions[r][c]]++
    }
  }
  return sizes
}

const ORTHO_DIRS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
]

/** 单个区域是否四连通（上下左右相邻） */
export function isRegionConnected(regions: number[][], regionId: number): boolean {
  const n = regions.length
  const cells: Array<[number, number]> = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (regions[r][c] === regionId) cells.push([r, c])
    }
  }
  if (cells.length === 0) return false
  if (cells.length === 1) return true

  const key = (r: number, c: number) => `${r},${c}`
  const set = new Set(cells.map(([r, c]) => key(r, c)))
  const queue: Array<[number, number]> = [cells[0]]
  const seen = new Set<string>([key(cells[0][0], cells[0][1])])

  while (queue.length > 0) {
    const [r, c] = queue.shift()!
    for (const [dr, dc] of ORTHO_DIRS) {
      const nr = r + dr
      const nc = c + dc
      const k = key(nr, nc)
      if (set.has(k) && !seen.has(k)) {
        seen.add(k)
        queue.push([nr, nc])
      }
    }
  }
  return seen.size === cells.length
}

/** 返回未连通的区域 ID 列表 */
export function getDisconnectedRegionIds(regions: number[][]): number[] {
  const n = regions.length
  const bad: number[] = []
  for (let id = 0; id < n; id++) {
    if (!isRegionConnected(regions, id)) bad.push(id)
  }
  return bad
}

export function areAllRegionsConnected(regions: number[][]): boolean {
  return getDisconnectedRegionIds(regions).length === 0
}

/** 是否至少有一个单格区域（开局线索） */
export function hasSingletonRegion(regions: number[][]): boolean {
  return regionSizes(regions).some((s) => s === 1)
}

/** 返回第一个单格区域的格子坐标；若无则 null */
export function findSingletonCell(
  regions: number[][],
): { r: number; c: number; regionId: number } | null {
  const sizes = regionSizes(regions)
  const singletonId = sizes.findIndex((s) => s === 1)
  if (singletonId < 0) return null
  const n = regions.length
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (regions[r][c] === singletonId) {
        return { r, c, regionId: singletonId }
      }
    }
  }
  return null
}

/**
 * 计数解的数量，找到 `limit` 个后早停（默认 2，用于唯一性判断）。
 */
export function countSolutions(regions: number[][], limit = 2): number {
  const n = regions.length
  const board = createEmptyBoard(n)
  const usedCols = new Array(n).fill(false)
  const usedRegions = new Array(n).fill(false)
  let count = 0

  const dfs = (row: number): void => {
    if (count >= limit) return
    if (row === n) {
      if (isSolved(board, regions)) count++
      return
    }

    for (let c = 0; c < n; c++) {
      if (count >= limit) return
      if (usedCols[c]) continue
      const regionId = regions[row][c]
      if (usedRegions[regionId]) continue

      board[row][c] = 'place'
      const conflicts = getConflicts(board, regions).cells
      const selfConflict = conflicts.some((p) => p.r === row && p.c === c)
      if (!selfConflict) {
        usedCols[c] = true
        usedRegions[regionId] = true
        dfs(row + 1)
        usedCols[c] = false
        usedRegions[regionId] = false
      }
      board[row][c] = 'empty'
    }
  }

  dfs(0)
  return count
}

export function hasSolution(regions: number[][]): boolean {
  return countSolutions(regions, 1) >= 1
}

export function hasUniqueSolution(regions: number[][]): boolean {
  return countSolutions(regions, 2) === 1
}

/** 若唯一解，返回每行放置的列；否则 null */
export function findUniqueSolution(regions: number[][]): number[] | null {
  const n = regions.length
  const board = createEmptyBoard(n)
  const usedCols = new Array(n).fill(false)
  const usedRegions = new Array(n).fill(false)
  const solutions: number[][] = []

  const dfs = (row: number, cols: number[]): void => {
    if (solutions.length >= 2) return
    if (row === n) {
      if (isSolved(board, regions)) solutions.push(cols.slice())
      return
    }
    for (let c = 0; c < n; c++) {
      if (solutions.length >= 2) return
      if (usedCols[c]) continue
      const regionId = regions[row][c]
      if (usedRegions[regionId]) continue
      board[row][c] = 'place'
      const conflicts = getConflicts(board, regions).cells
      const selfConflict = conflicts.some((p) => p.r === row && p.c === c)
      if (!selfConflict) {
        usedCols[c] = true
        usedRegions[regionId] = true
        cols.push(c)
        dfs(row + 1, cols)
        cols.pop()
        usedCols[c] = false
        usedRegions[regionId] = false
      }
      board[row][c] = 'empty'
    }
  }

  dfs(0, [])
  return solutions.length === 1 ? solutions[0] : null
}

export function validateLevel(level: Level): LevelValidationResult {
  const errors = validateStructure(level)
  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      hasSolution: false,
      solutionCount: 0,
      hasSingleton: false,
    }
  }

  const singleton = hasSingletonRegion(level.regions)
  if (!singleton) errors.push('missing singleton clue')

  const disconnected = getDisconnectedRegionIds(level.regions)
  if (disconnected.length > 0) {
    errors.push(`disconnected regions: ${disconnected.join(',')}`)
  }

  const solutionCount = countSolutions(level.regions, 2)
  if (solutionCount === 0) errors.push('no solution')
  else if (solutionCount >= 2) errors.push('not unique')

  return {
    ok: errors.length === 0,
    errors,
    hasSolution: solutionCount >= 1,
    solutionCount,
    hasSingleton: singleton,
  }
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
