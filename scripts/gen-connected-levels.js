/**
 * Generate levels: unique solution + singleton clue + 4-connected regions.
 * Usage: node scripts/gen-connected-levels.js
 */
function shuffle(a) {
  const x = a.slice()
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[x[i], x[j]] = [x[j], x[i]]
  }
  return x
}

function findPlacement(n) {
  const cols = [...Array(n).keys()]
  function ok(p) {
    const r = p.length - 1
    const c = p[r]
    for (let pr = 0; pr < r; pr++) {
      if (Math.abs(r - pr) <= 1 && Math.abs(c - p[pr]) <= 1) return false
    }
    return true
  }
  function dfs(p, rem) {
    if (p.length === n) return p
    for (const c of shuffle(rem)) {
      const n2 = p.concat([c])
      if (!ok(n2)) continue
      const r = dfs(
        n2,
        rem.filter((x) => x !== c),
      )
      if (r) return r
    }
    return null
  }
  for (let i = 0; i < 600; i++) {
    const r = dfs([], cols)
    if (r) return r
  }
  return null
}

function countSolutions(regions, limit = 2) {
  const n = regions.length
  const board = Array.from({ length: n }, () => Array(n).fill(0))
  const uc = Array(n).fill(false)
  const ur = Array(n).fill(false)
  let count = 0
  function bad() {
    const ps = []
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (board[r][c]) ps.push({ r, c })
    const rows = new Set(),
      cols = new Set(),
      regs = new Set()
    for (const p of ps) {
      if (rows.has(p.r) || cols.has(p.c) || regs.has(regions[p.r][p.c])) return true
      rows.add(p.r)
      cols.add(p.c)
      regs.add(regions[p.r][p.c])
    }
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i],
          b = ps[j]
        if (Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1) return true
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
      if (uc[c]) continue
      const rid = regions[row][c]
      if (ur[rid]) continue
      board[row][c] = 1
      if (!bad()) {
        uc[c] = ur[rid] = true
        dfs(row + 1)
        uc[c] = ur[rid] = false
      }
      board[row][c] = 0
    }
  }
  dfs(0)
  return count
}

function isRegionConnected(regions, id) {
  const n = regions.length
  const cells = []
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (regions[r][c] === id) cells.push([r, c])
  if (!cells.length) return false
  const key = (r, c) => `${r},${c}`
  const set = new Set(cells.map(([r, c]) => key(r, c)))
  const q = [cells[0]]
  const seen = new Set([key(cells[0][0], cells[0][1])])
  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ]
  while (q.length) {
    const [r, c] = q.shift()
    for (const [dr, dc] of dirs) {
      const nr = r + dr,
        nc = c + dc,
        k = key(nr, nc)
      if (set.has(k) && !seen.has(k)) {
        seen.add(k)
        q.push([nr, nc])
      }
    }
  }
  return seen.size === cells.length
}

function allConnected(regions) {
  const n = regions.length
  for (let id = 0; id < n; id++) if (!isRegionConnected(regions, id)) return false
  return true
}

function singletonCell(regions) {
  const n = regions.length
  const sizes = Array(n).fill(0)
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) sizes[regions[r][c]]++
  const id = sizes.findIndex((s) => s === 1)
  if (id < 0) return null
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (regions[r][c] === id) return { r, c, id }
  return null
}

/**
 * Grow regions only via orthogonal adjacency from seed cells.
 * singletonIds never grow beyond the seed cell.
 */
function buildConnected(placement, singletonIds) {
  const n = placement.length
  const singles = new Set(singletonIds)
  const regions = Array.from({ length: n }, () => Array(n).fill(-1))
  const sizes = Array(n).fill(0)
  const maxSize = Array(n).fill(0)

  for (let id = 0; id < n; id++) {
    maxSize[id] = singles.has(id) ? 1 : 2 + Math.floor(Math.random() * Math.max(2, Math.floor(n / 2)))
  }
  let capacity = maxSize.reduce((a, b) => a + b, 0)
  while (capacity < n * n) {
    let id = Math.floor(Math.random() * n)
    if (singles.has(id)) continue
    maxSize[id]++
    capacity++
  }

  for (let r = 0; r < n; r++) {
    regions[r][placement[r]] = r
    sizes[r] = 1
  }

  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ]
  let frontier = []
  for (let r = 0; r < n; r++) {
    if (singles.has(r)) continue
    frontier.push({ r, c: placement[r], id: r })
  }
  frontier = shuffle(frontier)

  while (frontier.length) {
    const i = Math.floor(Math.random() * frontier.length)
    const cur = frontier[i]
    frontier.splice(i, 1)
    if (sizes[cur.id] >= maxSize[cur.id]) continue
    for (const [dr, dc] of shuffle(dirs)) {
      const nr = cur.r + dr
      const nc = cur.c + dc
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue
      if (regions[nr][nc] !== -1) continue
      if (sizes[cur.id] >= maxSize[cur.id]) break
      regions[nr][nc] = cur.id
      sizes[cur.id]++
      frontier.push({ r: nr, c: nc, id: cur.id })
    }
  }

  // Fill remaining holes only by attaching to an orthogonally adjacent region
  // (keeps connectivity). Prefer smaller non-singleton regions.
  let guard = n * n * 4
  while (guard-- > 0) {
    let filled = false
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (regions[r][c] !== -1) continue
        const neighbors = []
        for (const [dr, dc] of dirs) {
          const nr = r + dr
          const nc = c + dc
          if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue
          const id = regions[nr][nc]
          if (id < 0 || singles.has(id)) continue
          neighbors.push(id)
        }
        if (!neighbors.length) continue
        // pick random neighbor id
        const id = neighbors[Math.floor(Math.random() * neighbors.length)]
        regions[r][c] = id
        sizes[id]++
        filled = true
      }
    }
    if (!filled) break
  }

  // Any leftover holes: fail this candidate
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (regions[r][c] < 0) return null
    }
  }
  if (!allConnected(regions)) return null
  return regions
}

function generate(n, singletonCount = 1) {
  for (let attempt = 0; attempt < 3000; attempt++) {
    const placement = findPlacement(n)
    if (!placement) continue
    const singles = []
    const used = new Set()
    while (singles.length < Math.min(singletonCount, n - 1)) {
      const s = Math.floor(Math.random() * n)
      if (used.has(s)) continue
      used.add(s)
      singles.push(s)
    }
    const regions = buildConnected(placement, singles)
    if (!regions) continue
    const regs = placement.map((c, r) => regions[r][c])
    if (new Set(regs).size !== n) continue
    if (!singletonCell(regions)) continue
    if (!allConnected(regions)) continue
    if (countSolutions(regions, 2) !== 1) continue
    return { regions, placement, singleton: singletonCell(regions) }
  }
  return null
}

function emit(label, n, count, singletonCount = 1) {
  const seen = new Set()
  const out = []
  let tries = 0
  while (out.length < count && tries < 40) {
    tries++
    const g = generate(n, singletonCount)
    if (!g) {
      console.log(`// ${label} attempt failed`)
      continue
    }
    const key = JSON.stringify(g.regions)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(g)
    console.log(JSON.stringify({ size: n, regions: g.regions, placement: g.placement, singleton: g.singleton }))
  }
  console.log(`// --- ${label}: got ${out.length}/${count} ---`)
  return out
}

emit('tut4', 4, 5, 1)
emit('easy5', 5, 4, 1)
emit('mid6', 6, 5, 1)
emit('hard7', 7, 3, 1)
emit('hard8', 8, 2, 2)
