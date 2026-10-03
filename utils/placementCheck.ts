/** 唯一解列为每行应放置的列下标 */
export function isSolutionCell(
  solutionCols: number[] | null | undefined,
  r: number,
  c: number,
): boolean {
  if (!solutionCols || r < 0 || r >= solutionCols.length) return false
  return solutionCols[r] === c
}
