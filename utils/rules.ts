import type { Board, CellPos, CellState, ConflictSet } from './types'

const NEXT_STATE: Record<CellState, CellState> = {
  empty: 'mark',
  mark: 'place',
  place: 'empty',
  wrong: 'wrong',
}

export function createEmptyBoard(size: number): Board {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'empty' as CellState),
  )
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice())
}

export function cycleCellState(state: CellState): CellState {
  return NEXT_STATE[state]
}

export type CellTapKind = 'single' | 'double'
export type PaintStrokeMode = 'mark' | 'empty'

/** 拖抹一笔：空白起笔涂 ×，× 起笔擦回空白；咕叽/红 × 不能起笔 */
export function paintModeFromOrigin(state: CellState): PaintStrokeMode | null {
  if (state === 'empty') return 'mark'
  if (state === 'mark') return 'empty'
  return null
}

/** 按本笔模式改一格；place / wrong 不变，非目标态也不变 */
export function applyPaintCell(state: CellState, mode: PaintStrokeMode): CellState {
  if (state === 'wrong' || state === 'place') return state
  if (mode === 'mark' && state === 'empty') return 'mark'
  if (mode === 'empty' && state === 'mark') return 'empty'
  return state
}

/** 单击空↔×，点咕叽清回空；双击空白或 × 放咕叽 */
export function applyCellTap(state: CellState, kind: CellTapKind): CellState {
  if (state === 'wrong') return 'wrong'
  if (kind === 'double' && (state === 'empty' || state === 'mark')) {
    return 'place'
  }
  if (state === 'empty') return 'mark'
  if (state === 'mark') return 'empty'
  return 'empty'
}

export function listPlacements(board: Board): CellPos[] {
  const result: CellPos[] = []
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 'place') {
        result.push({ r, c })
      }
    }
  }
  return result
}

function isAdjacent(a: CellPos, b: CellPos): boolean {
  const dr = Math.abs(a.r - b.r)
  const dc = Math.abs(a.c - b.c)
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0)
}

function pushUnique(cells: CellPos[], pos: CellPos): void {
  if (!cells.some((x) => x.r === pos.r && x.c === pos.c)) {
    cells.push(pos)
  }
}

/** 收集冲突格子：行/列/区域超量，以及相邻（含对角） */
export function getConflicts(board: Board, regions: number[][]): ConflictSet {
  const n = board.length
  const cells: CellPos[] = []
  const placements = listPlacements(board)

  const byRow = new Map<number, CellPos[]>()
  const byCol = new Map<number, CellPos[]>()
  const byRegion = new Map<number, CellPos[]>()

  for (const p of placements) {
    const rowList = byRow.get(p.r) ?? []
    rowList.push(p)
    byRow.set(p.r, rowList)

    const colList = byCol.get(p.c) ?? []
    colList.push(p)
    byCol.set(p.c, colList)

    const regionId = regions[p.r][p.c]
    const regionList = byRegion.get(regionId) ?? []
    regionList.push(p)
    byRegion.set(regionId, regionList)
  }

  for (const group of [byRow, byCol, byRegion]) {
    for (const list of group.values()) {
      if (list.length > 1) {
        for (const p of list) pushUnique(cells, p)
      }
    }
  }

  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      if (isAdjacent(placements[i], placements[j])) {
        pushUnique(cells, placements[i])
        pushUnique(cells, placements[j])
      }
    }
  }

  // 防御未使用 n，但保留以表达棋盘尺寸上下文
  void n
  return { cells }
}

export function isSolved(board: Board, regions: number[][]): boolean {
  const n = board.length
  const placements = listPlacements(board)
  if (placements.length !== n) return false
  return getConflicts(board, regions).cells.length === 0
}

/** 在当前盘面下，该格是否还能合法放置（已 mark 则否） */
export function canPlace(
  board: Board,
  regions: number[][],
  r: number,
  c: number,
): boolean {
  if (board[r][c] === 'mark' || board[r][c] === 'place' || board[r][c] === 'wrong') {
    return false
  }
  const next = cloneBoard(board)
  next[r][c] = 'place'
  const conflicts = getConflicts(next, regions).cells
  return !conflicts.some((p) => p.r === r && p.c === c)
}

/** 空格中已不可能再放咕叽的死格 */
export function findDeadCells(board: Board, regions: number[][]): CellPos[] {
  const n = board.length
  const dead: CellPos[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] !== 'empty') continue
      if (!canPlace(board, regions, r, c)) {
        dead.push({ r, c })
      }
    }
  }
  return dead
}

/** 将死格自动标为 ×，不改动已有 place/mark */
export function autoMarkDeadCells(board: Board, regions: number[][]): Board {
  const next = cloneBoard(board)
  for (const { r, c } of findDeadCells(next, regions)) {
    next[r][c] = 'mark'
  }
  return next
}

/**
 * 找「只剩一个合法空格」的行/列/区域，返回强制放置位置。
 * 若无强制格则返回 null。
 */
export function getForcedHint(board: Board, regions: number[][]): CellPos | null {
  const n = board.length
  const placements = listPlacements(board)

  const usedRows = new Set(placements.map((p) => p.r))
  const usedCols = new Set(placements.map((p) => p.c))
  const usedRegions = new Set(placements.map((p) => regions[p.r][p.c]))

  const candidatesFor = (
    predicate: (r: number, c: number) => boolean,
  ): CellPos[] => {
    const list: CellPos[] = []
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!predicate(r, c)) continue
        if (board[r][c] === 'place' || board[r][c] === 'wrong') continue
        if (canPlace(board, regions, r, c)) {
          list.push({ r, c })
        }
      }
    }
    return list
  }

  for (let r = 0; r < n; r++) {
    if (usedRows.has(r)) continue
    const cand = candidatesFor((rr) => rr === r)
    if (cand.length === 1) return cand[0]
  }

  for (let c = 0; c < n; c++) {
    if (usedCols.has(c)) continue
    const cand = candidatesFor((_r, cc) => cc === c)
    if (cand.length === 1) return cand[0]
  }

  for (let regionId = 0; regionId < n; regionId++) {
    if (usedRegions.has(regionId)) continue
    const cand = candidatesFor((r, c) => regions[r][c] === regionId)
    if (cand.length === 1) return cand[0]
  }

  return null
}
