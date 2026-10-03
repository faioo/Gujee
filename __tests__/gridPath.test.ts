import { cellsOnPath } from '../utils/gridPath'

describe('cellsOnPath', () => {
  test('horizontal path includes skipped middle cells', () => {
    expect(cellsOnPath(0, 0, 0, 3)).toEqual([
      { r: 0, c: 1 },
      { r: 0, c: 2 },
      { r: 0, c: 3 },
    ])
  })

  test('diagonal path includes the middle cell', () => {
    expect(cellsOnPath(0, 0, 2, 2)).toEqual([
      { r: 1, c: 1 },
      { r: 2, c: 2 },
    ])
  })

  test('same cell is empty', () => {
    expect(cellsOnPath(1, 1, 1, 1)).toEqual([])
  })
})
