/** Plain JS level solvability check (no deps) */
const LEVELS = require('./levels-data.json')

function createBoard(n) {
  return Array.from({ length: n }, () => Array(n).fill('empty'))
}

function listPlacements(board) {
  const out = []
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 'place') out.push({ r, c })
    }
  }
  return out
}

function adjacent(a, b) {
  const dr = Math.abs(a.r - b.r)
  const dc = Math.abs(a.c - b.c)
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0)
}

function hasConflict(board, regions) {
  const placements = listPlacements(board)
  const byRow = new Map()
  const byCol = new Map()
  const byReg = new Map()
  for (const p of placements) {
    byRow.set(p.r, (byRow.get(p.r) || 0) + 1)
    byCol.set(p.c, (byCol.get(p.c) || 0) + 1)
    const id = regions[p.r][p.c]
    byReg.set(id, (byReg.get(id) || 0) + 1)
  }
  for (const map of [byRow, byCol, byReg]) {
    for (const v of map.values()) if (v > 1) return true
  }
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      if (adjacent(placements[i], placements[j])) return true
    }
  }
  return false
}

function hasSolution(regions) {
  const n = regions.length
  const board = createBoard(n)
  const usedCols = Array(n).fill(false)
  const usedRegs = Array(n).fill(false)
  function dfs(row) {
    if (row === n) return !hasConflict(board, regions) && listPlacements(board).length === n
    for (let c = 0; c < n; c++) {
      if (usedCols[c]) continue
      const rid = regions[row][c]
      if (usedRegs[rid]) continue
      board[row][c] = 'place'
      if (!hasConflict(board, regions)) {
        usedCols[c] = true
        usedRegs[rid] = true
        if (dfs(row + 1)) return true
        usedCols[c] = false
        usedRegs[rid] = false
      }
      board[row][c] = 'empty'
    }
    return false
  }
  return dfs(0)
}

function structureOk(level) {
  const { size, regions } = level
  if (regions.length !== size) return 'row mismatch'
  const seen = new Set()
  for (let r = 0; r < size; r++) {
    if (regions[r].length !== size) return `row ${r} len`
    for (let c = 0; c < size; c++) {
      const v = regions[r][c]
      if (v < 0 || v >= size) return `bad id ${v}`
      seen.add(v)
    }
  }
  for (let i = 0; i < size; i++) if (!seen.has(i)) return `missing ${i}`
  return null
}

let fail = 0
for (const level of LEVELS) {
  const err = structureOk(level)
  const ok = !err && hasSolution(level.regions)
  console.log(`${ok ? 'OK' : 'FAIL'} ${level.id} ${err || ''} sol=${!err && hasSolution(level.regions)}`)
  if (!ok) fail++
}
console.log(`done fails=${fail}`)
process.exit(fail ? 1 : 0)
