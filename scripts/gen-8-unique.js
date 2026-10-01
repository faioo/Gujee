/** Generate unique 8x8 with two singleton regions */
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
  for (let i = 0; i < 500; i++) {
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

function build(placement, singletons) {
  const n = placement.length
  const singletonSet = new Set(singletons)
  const regions = Array.from({ length: n }, () => Array(n).fill(-1))
  const sizes = Array(n).fill(0)
  const maxSize = Array(n).fill(0)
  for (let id = 0; id < n; id++) {
    maxSize[id] = singletonSet.has(id) ? 1 : 2 + Math.floor(Math.random() * 3)
  }
  let capacity = maxSize.reduce((a, b) => a + b, 0)
  while (capacity < n * n) {
    let id = Math.floor(Math.random() * n)
    if (singletonSet.has(id)) continue
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
    if (singletonSet.has(r)) continue
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
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (regions[r][c] !== -1) continue
      let best = -1
      let bd = 1e9
      for (let id = 0; id < n; id++) {
        if (singletonSet.has(id)) continue
        const d = Math.abs(r - id) + Math.abs(c - placement[id])
        if (d < bd) {
          bd = d
          best = id
        }
      }
      regions[r][c] = best
    }
  }
  return regions
}

const n = 8
const seen = new Set()
let got = 0
for (let t = 0; t < 15000 && got < 2; t++) {
  const placement = findPlacement(n)
  if (!placement) continue
  const s1 = Math.floor(Math.random() * n)
  let s2 = Math.floor(Math.random() * n)
  while (s2 === s1) s2 = Math.floor(Math.random() * n)
  const regions = build(placement, [s1, s2])
  const sizes = Array(n).fill(0)
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) sizes[regions[r][c]]++
  if (!sizes.some((x) => x === 1)) continue
  if (sizes.some((x) => x === 0)) continue
  const regs = placement.map((c, r) => regions[r][c])
  if (new Set(regs).size !== n) continue
  const key = JSON.stringify(regions)
  if (seen.has(key)) continue
  if (countSolutions(regions, 2) !== 1) continue
  seen.add(key)
  const id = sizes.findIndex((x) => x === 1)
  let singleton = null
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (regions[r][c] === id) singleton = { r, c, id }
  console.log(JSON.stringify({ size: n, regions, placement, singleton }))
  got++
}
console.log('got', got)
