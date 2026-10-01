/**
 * Generate a solvable color-queens region grid of size n.
 * Placement: one per row/col, adjacent rows have |col diff| >= 2.
 * Regions: seed each placement cell with unique region, flood remaining.
 */
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function findPlacement(n) {
  const cols = Array.from({ length: n }, (_, i) => i)
  function ok(partial) {
    const r = partial.length - 1
    const c = partial[r]
    for (let pr = 0; pr < r; pr++) {
      const pc = partial[pr]
      if (Math.abs(r - pr) <= 1 && Math.abs(c - pc) <= 1) return false
    }
    return true
  }
  function dfs(partial, remaining) {
    if (partial.length === n) return partial
    for (const c of shuffle(remaining)) {
      const next = partial.concat([c])
      if (!ok(next)) continue
      const res = dfs(
        next,
        remaining.filter((x) => x !== c),
      )
      if (res) return res
    }
    return null
  }
  for (let attempt = 0; attempt < 200; attempt++) {
    const res = dfs([], cols)
    if (res) return res
  }
  return null
}

function buildRegions(placement) {
  const n = placement.length
  const regions = Array.from({ length: n }, () => Array(n).fill(-1))
  // seed
  for (let r = 0; r < n; r++) {
    regions[r][placement[r]] = r
  }
  // assign each empty cell to nearest seeded region (manhattan), with jitter
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (regions[r][c] !== -1) continue
      let best = 0
      let bestDist = Infinity
      const order = shuffle(Array.from({ length: n }, (_, i) => i))
      for (const id of order) {
        const pr = id // seed row = region id in our scheme
        const pc = placement[id]
        const d = Math.abs(r - pr) + Math.abs(c - pc)
        if (d < bestDist) {
          bestDist = d
          best = id
        }
      }
      regions[r][c] = best
    }
  }
  return regions
}

function hasConflict(board, regions) {
  const n = board.length
  const placements = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] === 1) placements.push({ r, c })
    }
  }
  const rows = new Set()
  const cols = new Set()
  const regs = new Set()
  for (const p of placements) {
    if (rows.has(p.r) || cols.has(p.c) || regs.has(regions[p.r][p.c])) return true
    rows.add(p.r)
    cols.add(p.c)
    regs.add(regions[p.r][p.c])
  }
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i]
      const b = placements[j]
      if (Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1) return true
    }
  }
  return false
}

function verifySolution(regions, placement) {
  const n = regions.length
  const board = Array.from({ length: n }, () => Array(n).fill(0))
  for (let r = 0; r < n; r++) board[r][placement[r]] = 1
  // also check one-per-region: our seed ensures region id r contains cell (r, placement[r])
  // but flood may have moved — need placement cell's region to be unique among placements
  const regIds = placement.map((c, r) => regions[r][c])
  if (new Set(regIds).size !== n) return false
  return !hasConflict(board, regions)
}

function generate(n) {
  for (let i = 0; i < 500; i++) {
    const placement = findPlacement(n)
    if (!placement) continue
    const regions = buildRegions(placement)
    if (verifySolution(regions, placement)) {
      return { regions, placement }
    }
  }
  throw new Error('failed to generate ' + n)
}

function solveExists(regions) {
  const n = regions.length
  const board = Array.from({ length: n }, () => Array(n).fill(0))
  const usedCols = Array(n).fill(false)
  const usedRegs = Array(n).fill(false)
  function conflict() {
    const ps = []
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (board[r][c]) ps.push({ r, c })
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j]
        if (Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1) return true
      }
    }
    return false
  }
  function dfs(row) {
    if (row === n) return true
    for (let c = 0; c < n; c++) {
      if (usedCols[c]) continue
      const rid = regions[row][c]
      if (usedRegs[rid]) continue
      board[row][c] = 1
      if (!conflict()) {
        usedCols[c] = true
        usedRegs[rid] = true
        if (dfs(row + 1)) return true
        usedCols[c] = false
        usedRegs[rid] = false
      }
      board[row][c] = 0
    }
    return false
  }
  return dfs(0)
}

const sizes = [4, 4, 4, 8]
const seen = new Set()
for (const n of sizes) {
  let out = null
  for (let t = 0; t < 50; t++) {
    const { regions, placement } = generate(n)
    const key = JSON.stringify(regions)
    if (seen.has(key)) continue
    if (!solveExists(regions)) continue
    seen.add(key)
    out = { regions, placement }
    break
  }
  console.log('N', n, 'placement', out.placement.join(','))
  console.log(JSON.stringify(out.regions))
}
