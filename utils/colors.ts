/** 色盲友好：鲜明底色 + 棋盘边框辅助区分区域 */
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
]

export function colorsForSize(size: number): string[] {
  const list: string[] = []
  for (let i = 0; i < size; i++) {
    list.push(REGION_COLORS[i % REGION_COLORS.length])
  }
  return list
}
