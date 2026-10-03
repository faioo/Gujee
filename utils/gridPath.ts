import type { CellPos } from './types'

/** Chebyshev 路径：不含起点、含终点，每步最多移动一格（含斜向） */
export function cellsOnPath(
  r0: number,
  c0: number,
  r1: number,
  c1: number,
): CellPos[] {
  const dr = r1 - r0
  const dc = c1 - c0
  const steps = Math.max(Math.abs(dr), Math.abs(dc))
  if (steps === 0) return []
  const cells: CellPos[] = []
  let prevR = r0
  let prevC = c0
  for (let i = 1; i <= steps; i++) {
    const r = r0 + Math.round((dr * i) / steps)
    const c = c0 + Math.round((dc * i) / steps)
    if (r === prevR && c === prevC) continue
    cells.push({ r, c })
    prevR = r
    prevC = c
  }
  return cells
}
