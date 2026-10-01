/**
 * Generate unique-solution color-queens boards with at least one singleton region.
 * Usage: node scripts/gen-unique-levels.js
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
      if (Math.abs(r - pr) <= 1 && Math.abs(c - partial[pr]) <= 1) return false
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
  for (let attempt = 0; attempt < 400; attempt++) {
    const res = dfs([], cols)
    if (res) return res
  }
  return null
}

function countSolutions(regions, limit = 2) {
  const n = regions.length
  const board = Array.from({ length: n }, () => Array(n).fill(0))
  const usedCols = Array(n).fill(false)
  const usedRegs = Array(n).fill(false)
  let count = 0

  function conflictPartial() {
    const ps = []
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c]) ps.push({ r, c })
      }
    }
    const rows = new Set()
    const cols = new Set()
    const regs = new Set()
    for (const p of ps) {
      if (rows.has(p.r) || cols.has(p.c) || regs.has(regions[p.r][p.c])) return true
      rows.add(p.r)
      cols.add(p.c)
      regs.add(regions[p.r][p.c])
    }
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i]
        const b = ps[j]
        if (Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1) return true
      }
    }
    return false
  }

  function dfs(row) {
    if (count >= limit) return
    if (row === n) {
      count++
      return
    }
    for (let c = 0; c < n; c++) {
      if (count >= limit) return
      if (usedCols[c]) continue
      const rid = regions[row][c]
      if (usedRegs[rid]) continue
      board[row][c] = 1
      if (!conflictPartial()) {
        usedCols[c] = true
        usedRegs[rid] = true
        dfs(row + 1)
        usedCols[c] = false
        usedRegs[rid] = false
      }
      board[row][c] = 0
    }
  }

  dfs(0)
  return count
}

function hasSingleton(regions) {
  const n = regions.length
  const sizes = Array(n).fill(0)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) sizes[regions[r][c]]++
  }
  return sizes.some((s) => s === 1)
}

function findSingletonCell(regions) {
  const n = regions.length
  const sizes = Array(n).fill(0)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) sizes[regions[r][c]]++
  }
  const id = sizes.findIndex((s) => s === 1)
  if (id < 0) return null
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (regions[r][c] === id) return { r, c, id }
    }
  }
  return null
}

/**
 * Build regions from placement:
 * - Force region `singletonRow` to be ONLY the placement cell (singleton clue)
 * - Other empty cells assigned to nearest non-singleton regions
 */
function buildRegionsWithSingleton(placement, singletonRow) {
  const n = placement.length
  const regions = Array.from({ length: n }, () => Array(n).fill(-1))
  for (let r = 0; r < n; r++) {
    regions[r][placement[r]] = r
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (regions[r][c] !== -1) continue
      let best = singletonRow === 0 ? 1 : 0
      let bestDist = Infinity
      for (let id = 0; id < n; id++) {
        if (id === singletonRow) continue
        const pr = id
        const pc = placement[id]
        const d = Math.abs(r - pr) + Math.abs(c - pc) + Math.random() * 0.3
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

function generateUnique(n, maxAttempts = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const placement = findPlacement(n)
    if (!placement) continue
    const singletonRow = Math.floor(Math.random() * n)
    const regions = buildRegionsWithSingleton(placement, singletonRow)
    if (!hasSingleton(regions)) continue
    // placement cell regions must stay unique
    const regIds = placement.map((c, r) => regions[r][c])
    if (new Set(regIds).size !== n) continue
    const solCount = countSolutions(regions, 2)
    if (solCount === 1) {
      return {
        regions,
        placement,
        singleton: findSingletonCell(regions),
      }
    }
  }
  return null
}

function emit(label, n, count) {
  const seen = new Set()
  const out = []
  let tries = 0
  while (out.length < count && tries < 80) {
    tries++
    const g = generateUnique(n)
    if (!g) continue
    const key = JSON.stringify(g.regions)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(g)
  }
  console.log(`\n// --- ${label} x${out.length} (size ${n}) ---`)
  for (const g of out) {
    console.log(
      JSON.stringify({
        size: n,
        regions: g.regions,
        placement: g.placement,
        singleton: g.singleton,
      }),
    )
  }
  return out
}

emit('tutorial-pool', 4, 6)
emit('easy-5', 5, 4)
emit('mid-6', 6, 5)
emit('hard-7', 7, 3)
emit('hard-8', 8, 2)
