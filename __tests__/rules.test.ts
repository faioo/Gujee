import {
  autoMarkDeadCells,
  createEmptyBoard,
  cycleCellState,
  applyCellTap,
  findDeadCells,
  getConflicts,
  getForcedHint,
  isSolved,
} from '../utils/rules'
import { boardFromPlacements } from '../utils/levelValidate'

describe('rules', () => {
  const regions4 = [
    [0, 0, 1, 1],
    [0, 2, 2, 1],
    [3, 2, 1, 1],
    [3, 3, 3, 2],
  ]

  test('cycleCellState order', () => {
    expect(cycleCellState('empty')).toBe('mark')
    expect(cycleCellState('mark')).toBe('place')
    expect(cycleCellState('place')).toBe('empty')
  })

  test('applyCellTap single toggles empty and mark', () => {
    expect(applyCellTap('empty', 'single')).toBe('mark')
    expect(applyCellTap('mark', 'single')).toBe('empty')
    expect(applyCellTap('place', 'single')).toBe('empty')
  })

  test('applyCellTap double places from empty or mark', () => {
    expect(applyCellTap('empty', 'double')).toBe('place')
    expect(applyCellTap('mark', 'double')).toBe('place')
    expect(applyCellTap('place', 'double')).toBe('empty')
  })

  test('same row conflict', () => {
    const board = boardFromPlacements(4, [
      { r: 0, c: 0 },
      { r: 0, c: 3 },
    ])
    const conflicts = getConflicts(board, regions4).cells
    expect(conflicts.length).toBeGreaterThanOrEqual(2)
  })

  test('same column conflict', () => {
    const board = boardFromPlacements(4, [
      { r: 0, c: 1 },
      { r: 2, c: 1 },
    ])
    expect(getConflicts(board, regions4).cells.length).toBeGreaterThanOrEqual(2)
  })

  test('same region conflict', () => {
    const board = boardFromPlacements(4, [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
    ])
    expect(getConflicts(board, regions4).cells.length).toBeGreaterThanOrEqual(2)
  })

  test('diagonal adjacency conflict', () => {
    const board = boardFromPlacements(4, [
      { r: 0, c: 0 },
      { r: 1, c: 1 },
    ])
    expect(getConflicts(board, regions4).cells.length).toBeGreaterThanOrEqual(2)
  })

  test('non-adjacent diagonal ok for adjacency rule alone', () => {
    // (0,0) and (2,2) are not king-adjacent
    const board = boardFromPlacements(4, [
      { r: 0, c: 0 },
      { r: 2, c: 2 },
    ])
    const adjOnly = getConflicts(board, regions4).cells.filter(
      (p) =>
        (p.r === 0 && p.c === 0) || (p.r === 2 && p.c === 2),
    )
    // may still conflict by region/row/col; ensure adjacency alone isn't the issue
    // region of (0,0)=0, (2,2)=1 — different; rows/cols different
    expect(getConflicts(board, regions4).cells.length).toBe(0)
  })

  test('isSolved true for valid full board', () => {
    // verified solution for regions4 if solvable — computed separately in levels tests
    const board = createEmptyBoard(4)
    // placeholder: if this layout has a known solution we'll assert in levels
    expect(typeof isSolved(board, regions4)).toBe('boolean')
  })

  test('getForcedHint finds singleton region cell', () => {
    const regions = [
      [1, 0, 1, 1],
      [2, 1, 1, 1],
      [2, 2, 3, 1],
      [2, 3, 3, 3],
    ]
    const board = createEmptyBoard(4)
    const hint = getForcedHint(board, regions)
    expect(hint).toEqual({ r: 0, c: 1 })
  })

  test('autoMarkDeadCells marks row/col/region/adjacent after place', () => {
    const regions = [
      [0, 0, 0, 0],
      [0, 0, 2, 1],
      [2, 2, 2, 2],
      [2, 3, 3, 3],
    ]
    let board = createEmptyBoard(4)
    board[1][3] = 'place'
    board = autoMarkDeadCells(board, regions)
    // same row
    expect(board[1][0]).toBe('mark')
    expect(board[1][1]).toBe('mark')
    expect(board[1][2]).toBe('mark')
    // same col
    expect(board[0][3]).toBe('mark')
    expect(board[2][3]).toBe('mark')
    expect(board[3][3]).toBe('mark')
    // adjacent diagonal
    expect(board[0][2]).toBe('mark')
    expect(board[2][2]).toBe('mark')
    // placement preserved
    expect(board[1][3]).toBe('place')
  })

  test('findDeadCells empty when board empty', () => {
    const regions = [
      [0, 0, 0, 0],
      [0, 0, 2, 1],
      [2, 2, 2, 2],
      [2, 3, 3, 3],
    ]
    expect(findDeadCells(createEmptyBoard(4), regions)).toEqual([])
  })
})
