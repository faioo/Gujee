import { findUniqueSolution } from '../utils/levelValidate'
import { isSolutionCell } from '../utils/placementCheck'
import { applyCellTap } from '../utils/rules'

describe('placementCheck', () => {
  const regions = [
    [0, 0, 0, 0],
    [0, 0, 2, 1],
    [2, 2, 2, 2],
    [2, 3, 3, 3],
  ]

  test('matches the unique solution cell and rejects others', () => {
    const cols = findUniqueSolution(regions)
    expect(cols).not.toBeNull()
    const solution = cols as number[]
    expect(isSolutionCell(solution, 0, solution[0])).toBe(true)
    expect(isSolutionCell(solution, 0, (solution[0] + 1) % 4)).toBe(false)
    expect(isSolutionCell(null, 0, 0)).toBe(false)
  })
})

describe('applyCellTap wrong lock', () => {
  test('does not change a wrong cell', () => {
    expect(applyCellTap('wrong', 'single')).toBe('wrong')
    expect(applyCellTap('wrong', 'double')).toBe('wrong')
  })
})
