import { areAllRegionsConnected, regionSizes } from '../utils/levelValidate'
import type { Level } from '../utils/types'

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function randInt(rand: () => number, n: number): number {
  return Math.floor(rand() * n)
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(rand, i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function findSolutions(
  regions: number[][],
  limit: number,
  deadline: number,
): number[][] | null {
  const n = regions.length
  const usedCols = new Array(n).fill(false)
  const usedRegions = new Array(n).fill(false)
  const placedC: number[] = []
  const sols: number[][] = []
  let timedOut = false

  const dfs = (row: number): void => {
    if (Date.now() > deadline) {
      timedOut = true
      return
    }
    if (sols.length >= limit) return
    if (row === n) {
      sols.push(placedC.slice())
      return
    }
    for (let c = 0; c < n; c++) {
      if (timedOut || sols.length >= limit) return
      if (usedCols[c]) continue
      const regionId = regions[row][c]
      if (usedRegions[regionId]) continue
      if (row > 0 && Math.abs(placedC[row - 1] - c) <= 1) continue
      usedCols[c] = true
      usedRegions[regionId] = true
      placedC[row] = c
      dfs(row + 1)
      usedCols[c] = false
      usedRegions[regionId] = false
    }
  }

  dfs(0)
  return timedOut ? null : sols
}

function randomPlacement(n: number, rand: () => number): number[] | null {
  const cols: number[] = []
  const used = new Array(n).fill(false)
  const dfs = (row: number): boolean => {
    if (row === n) return true
    for (const c of shuffle(
      Array.from({ length: n }, (_, i) => i),
      rand,
    )) {
      if (used[c]) continue
      if (row > 0 && Math.abs(cols[row - 1] - c) <= 1) continue
      used[c] = true
      cols[row] = c
      if (dfs(row + 1)) return true
      used[c] = false
    }
    return false
  }
  return dfs(0) ? cols : null
}

const ORTHO: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
]

function growRegions(
  n: number,
  cols: number[],
  keepSingle: number[],
  maxRegion: number,
  rand: () => number,
): number[][] | null {
  const regions = Array.from({ length: n }, () => new Array(n).fill(-1))
  const sizes = new Array(n).fill(0)
  for (let r = 0; r < n; r++) {
    regions[r][cols[r]] = r
    sizes[r] = 1
  }
  const frozen = new Set(keepSingle)
  let remaining = n * n - n
  let guard = n * n * 80
  while (remaining > 0 && guard-- > 0) {
    const options: Array<{ r: number; c: number; id: number }> = []
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (regions[r][c] !== -1) continue
        const seen = new Set<number>()
        for (const [dr, dc] of ORTHO) {
          const nr = r + dr
          const nc = c + dc
          if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue
          const id = regions[nr][nc]
          if (id < 0) continue
          if (frozen.has(id) && remaining > n) continue
          if (sizes[id] >= maxRegion) continue
          if (!seen.has(id)) {
            seen.add(id)
            options.push({ r, c, id })
          }
        }
      }
    }
    let pool = options
    const fillPool = (allowFrozen: boolean, ignoreMax: boolean) => {
      const next: Array<{ r: number; c: number; id: number }> = []
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (regions[r][c] !== -1) continue
          const seen = new Set<number>()
          for (const [dr, dc] of ORTHO) {
            const nr = r + dr
            const nc = c + dc
            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue
            const id = regions[nr][nc]
            if (id < 0) continue
            if (!allowFrozen && frozen.has(id)) continue
            if (!ignoreMax && sizes[id] >= maxRegion) continue
            if (!seen.has(id)) {
              seen.add(id)
              next.push({ r, c, id })
            }
          }
        }
      }
      return next
    }
    if (pool.length === 0) pool = fillPool(false, true)
    if (pool.length === 0) pool = fillPool(true, true)
    if (pool.length === 0) return null
    pool.sort((a, b) => sizes[a.id] - sizes[b.id])
    const slice = pool.slice(0, Math.max(6, Math.floor(pool.length * 0.4)))
    const pick = slice[randInt(rand, slice.length)]
    if (regions[pick.r][pick.c] !== -1) continue
    regions[pick.r][pick.c] = pick.id
    sizes[pick.id]++
    remaining--
  }
  return remaining > 0 ? null : regions
}

type Spec = {
  size: number
  count: number
  difficulty: 1 | 2 | 3
  maxSingle: number
  maxRegion: number
  namePrefix: string
  idPrefix: string
  uniqueMs: number
}

const SPECS: Spec[] = [
  { size: 5, count: 2, difficulty: 1, maxSingle: 2, maxRegion: 14, namePrefix: '晨鸣', idPrefix: 'n-5', uniqueMs: 200 },
  { size: 6, count: 2, difficulty: 1, maxSingle: 2, maxRegion: 16, namePrefix: '暖窝', idPrefix: 'n-6', uniqueMs: 400 },
  { size: 7, count: 2, difficulty: 2, maxSingle: 2, maxRegion: 20, namePrefix: '暮歌', idPrefix: 'n-7', uniqueMs: 800 },
  { size: 8, count: 2, difficulty: 2, maxSingle: 2, maxRegion: 22, namePrefix: '星巢', idPrefix: 'n-8', uniqueMs: 1500 },
  { size: 9, count: 2, difficulty: 3, maxSingle: 2, maxRegion: 18, namePrefix: '霜岭', idPrefix: 'n-9', uniqueMs: 1200 },
  { size: 9, count: 4, difficulty: 3, maxSingle: 2, maxRegion: 16, namePrefix: '夜潮', idPrefix: 'n-9b', uniqueMs: 1200 },
  { size: 10, count: 4, difficulty: 3, maxSingle: 2, maxRegion: 18, namePrefix: '深潮', idPrefix: 'n-10', uniqueMs: 2000 },
]

const NUM = ['一', '二', '三', '四']

function cloneRegions(regions: number[][]): number[][] {
  return regions.map((row) => row.slice())
}

function mutateRegions(
  regions: number[][],
  seedCells: Set<string>,
  rand: () => number,
): boolean {
  const n = regions.length
  const sizes = regionSizes(regions)
  const moves: Array<{ r: number; c: number; from: number; to: number }> = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (seedCells.has(`${r},${c}`)) continue
      const from = regions[r][c]
      if (sizes[from] <= 1) continue
      const seen = new Set<number>()
      for (const [dr, dc] of ORTHO) {
        const nr = r + dr
        const nc = c + dc
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue
        const to = regions[nr][nc]
        if (to === from || seen.has(to)) continue
        seen.add(to)
        moves.push({ r, c, from, to })
      }
    }
  }
  if (moves.length === 0) return false
  for (const move of shuffle(moves, rand).slice(0, 24)) {
    const next = cloneRegions(regions)
    next[move.r][move.c] = move.to
    if (!areAllRegionsConnected(next)) continue
    const singles = regionSizes(next).filter((s) => s === 1).length
    if (singles < 1) continue
    regions[move.r][move.c] = move.to
    return true
  }
  return false
}

function peelToSingleton(
  regions: number[][],
  cols: number[],
  rand: () => number,
): boolean {
  const n = regions.length
  const order = shuffle(
    Array.from({ length: n }, (_, i) => i),
    rand,
  )
  for (const id of order) {
    const sr = id
    const sc = cols[id]
    let guard = n * n
    while (guard-- > 0) {
      const sizes = regionSizes(regions)
      if (sizes[id] === 1) return true
      const leaves: Array<{ r: number; c: number; to: number }> = []
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (regions[r][c] !== id) continue
          if (r === sr && c === sc) continue
          for (const [dr, dc] of ORTHO) {
            const nr = r + dr
            const nc = c + dc
            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue
            const to = regions[nr][nc]
            if (to !== id && to >= 0) {
              leaves.push({ r, c, to })
              break
            }
          }
        }
      }
      if (leaves.length === 0) break
      const pick = leaves[randInt(rand, leaves.length)]
      const next = cloneRegions(regions)
      next[pick.r][pick.c] = pick.to
      if (!areAllRegionsConnected(next)) continue
      regions[pick.r][pick.c] = pick.to
    }
  }
  return regionSizes(regions).some((s) => s === 1)
}

function killAlternate(
  regions: number[][],
  sol1: number[],
  sol2: number[],
  seedCells: Set<string>,
  rand: () => number,
): boolean {
  const n = regions.length
  const targets: Array<{ r: number; c: number }> = []
  for (let r = 0; r < n; r++) {
    if (sol2[r] !== sol1[r]) targets.push({ r, c: sol2[r] })
  }
  for (const cell of shuffle(targets, rand)) {
    if (seedCells.has(`${cell.r},${cell.c}`)) continue
    const from = regions[cell.r][cell.c]
    const sizes = regionSizes(regions)
    if (sizes[from] <= 1) continue
    const tos: number[] = []
    for (const [dr, dc] of ORTHO) {
      const nr = cell.r + dr
      const nc = cell.c + dc
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue
      const to = regions[nr][nc]
      if (to !== from && !tos.includes(to)) tos.push(to)
    }
    for (const to of shuffle(tos, rand)) {
      const next = cloneRegions(regions)
      next[cell.r][cell.c] = to
      if (!areAllRegionsConnected(next)) continue
      if (!regionSizes(next).some((s) => s === 1)) continue
      regions[cell.r][cell.c] = to
      return true
    }
  }
  return mutateRegions(regions, seedCells, rand)
}

function generateOne(
  spec: Spec,
  seed: number,
  stats?: Record<string, number>,
): number[][] | null {
  const bump = (k: string) => {
    if (stats) stats[k] = (stats[k] ?? 0) + 1
  }
  const rand = mulberry32(seed)
  const cols = randomPlacement(spec.size, rand)
  if (!cols) {
    bump('place')
    return null
  }
  const ids = shuffle(
    Array.from({ length: spec.size }, (_, i) => i),
    rand,
  )
  const keepN = spec.size >= 9 ? 0 : spec.maxSingle
  const keepSingle = ids.slice(0, keepN)
  const regions = growRegions(spec.size, cols, keepSingle, spec.maxRegion, rand)
  if (!regions) {
    bump('grow')
    return null
  }
  if (!areAllRegionsConnected(regions)) {
    bump('conn')
    return null
  }
  if (spec.size >= 9 && !peelToSingleton(regions, cols, rand)) {
    bump('peel')
    return null
  }
  let singles = regionSizes(regions).filter((s) => s === 1).length
  if (singles < 1 || singles > spec.maxSingle) {
    bump(`singles${singles}`)
    return null
  }
  const seedCells = new Set(cols.map((c, r) => `${r},${c}`))
  const mutates = spec.size >= 10 ? 64 : spec.size >= 9 ? 48 : 0
  for (let m = 0; m <= mutates; m++) {
    const sols = findSolutions(regions, 2, Date.now() + spec.uniqueMs)
    if (sols === null) {
      bump('timeout')
      return null
    }
    if (sols.length === 1) return regions
    if (sols.length === 0) {
      bump('nsol0')
      return null
    }
    if (m === mutates) {
      bump('nsol2')
      return null
    }
    if (!killAlternate(regions, sols[0], sols[1], seedCells, rand)) {
      bump('nomove')
      return null
    }
    singles = regionSizes(regions).filter((s) => s === 1).length
    if (singles < 1 || singles > spec.maxSingle) {
      bump(`singles${singles}`)
      return null
    }
  }
  return null
}

export function generateOfficialLevels(baseSeed = 20261003, onlySize?: number): Level[] {
  const out: Level[] = []
  let seed = baseSeed
  for (const spec of SPECS) {
    if (onlySize !== undefined && spec.size !== onlySize) continue
    const seen = new Set<string>()
    for (let i = 0; i < spec.count; i++) {
      let found: number[][] | null = null
      const tries = spec.size >= 10 ? 400 : spec.size >= 9 ? 300 : 8000
      const stats: Record<string, number> = {}
      for (let t = 0; t < tries && !found; t++) {
        seed += 19 + spec.size * 5 + (t % 97)
        const regions = generateOne(spec, seed, spec.size >= 9 ? stats : undefined)
        if (!regions) continue
        const key = JSON.stringify(regions)
        if (seen.has(key)) continue
        seen.add(key)
        found = regions
      }
      if (!found) {
        console.error('stats', stats)
        throw new Error(`failed to generate ${spec.idPrefix}-${i + 1}`)
      }
      out.push({
        id: spec.idPrefix.startsWith('n-9')
          ? `n-9-${out.filter((l) => l.size === 9).length + 1}`
          : `${spec.idPrefix}-${i + 1}`,
        name: `${spec.namePrefix} · ${NUM[i]}`,
        kind: 'normal',
        difficulty: spec.difficulty,
        size: spec.size,
        regions: found,
      })
      console.error(`ok ${spec.idPrefix}-${i + 1}`)
    }
  }
  return out
}

if (require.main === module) {
  const onlyTen = process.argv.includes('--only=10')
  const levels = generateOfficialLevels(onlyTen ? 20261010 : 20261003, onlyTen ? 10 : undefined)
  process.stdout.write(JSON.stringify(levels))
}
