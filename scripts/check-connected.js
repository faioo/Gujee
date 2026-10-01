/** Check which levels have disconnected regions (4-connected). */
const fs = require('fs')
const path = require('path')

// Load levels by eval-ish parse from TS
const text = fs.readFileSync(path.join(__dirname, '../data/levels.ts'), 'utf8')
const start = text.indexOf('[', text.indexOf('export const LEVELS'))
const end = text.indexOf('export function getLevels')
let raw = text.slice(start, end).trim().replace(/;?\s*$/, '')
raw = raw.replace(/\/\/.*$/gm, '')
raw = raw.replace(/([{\[,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
raw = raw.replace(/'/g, '"')
raw = raw.replace(/,(\s*[}\]])/g, '$1')
const LEVELS = JSON.parse(raw)

function isRegionConnected(regions, id) {
  const n = regions.length
  const cells = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (regions[r][c] === id) cells.push([r, c])
    }
  }
  if (cells.length === 0) return false
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
      const nr = r + dr
      const nc = c + dc
      const k = key(nr, nc)
      if (set.has(k) && !seen.has(k)) {
        seen.add(k)
        q.push([nr, nc])
      }
    }
  }
  return seen.size === cells.length
}

let fail = 0
for (const l of LEVELS) {
  const bad = []
  for (let id = 0; id < l.size; id++) {
    if (!isRegionConnected(l.regions, id)) bad.push(id)
  }
  if (bad.length) {
    fail++
    console.log('DISC', l.id, 'regions', bad.join(','))
  } else {
    console.log('OK', l.id)
  }
}
console.log('disconnected levels:', fail)
