const fs = require('fs')
const path = require('path')

const text = fs.readFileSync(path.join(__dirname, '../data/levels.ts'), 'utf8')
const start = text.indexOf('export const LEVELS')
const arrStart = text.indexOf('[', start)
const endMarker = text.indexOf('export function getLevels', arrStart)
const arrText = text.slice(arrStart, endMarker).trim().replace(/;?\s*$/, '')

// naive TS object -> JSON: quote keys, keep arrays
function tsArrayToJson(src) {
  // remove trailing commas before ] or }
  let s = src
  // strip comments
  s = s.replace(/\/\/.*$/gm, '')
  // quote unquoted keys
  s = s.replace(/([{\[,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
  // single to double quotes for strings
  s = s.replace(/'/g, '"')
  // trailing commas
  s = s.replace(/,(\s*[}\]])/g, '$1')
  return JSON.parse(s)
}

const levels = tsArrayToJson(arrText)
fs.writeFileSync(path.join(__dirname, 'levels-data.json'), JSON.stringify(levels, null, 2))
console.log('levels', levels.length)
