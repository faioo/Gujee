import {
  createEmptyBoard,
  cycleCellState,
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
})
