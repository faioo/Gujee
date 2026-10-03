/** 默认分区色：鲜明底色 + 棋盘边框辅助区分区域 */
export const REGION_COLORS = [
  '#F6B6C3',
  '#A8D5E5',
  '#F6E27A',
  '#B8E0A8',
  '#D4B5F0',
  '#F5C89A',
  '#9FD4C6',
  '#E8A0B8',
  '#C5D4E8',
  '#E8D4A8',
  '#C8E6C0',
  '#F3D0E8',
]

/** Okabe–Ito 高对比色板，再补 4 色覆盖当前预期尺寸 */
export const COLOR_WEAK_PALETTE = [
  '#E69F00',
  '#56B4E9',
  '#009E73',
  '#F0E442',
  '#0072B2',
  '#D55E00',
  '#CC79A7',
  '#7A7A7A',
  '#332288',
  '#88CCEE',
  '#117733',
  '#AA4499',
]

export function colorsForSize(size: number, colorWeak = false): string[] {
  const palette = colorWeak ? COLOR_WEAK_PALETTE : REGION_COLORS
  const list: string[] = []
  for (let i = 0; i < size; i++) {
    list.push(palette[i % palette.length])
  }
  return list
}
