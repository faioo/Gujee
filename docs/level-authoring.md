# 关卡编写指南

## 数据形状

```ts
interface Level {
  id: string
  name: string
  kind: 'tutorial' | 'normal'
  size: number
  regions: number[][]  // size×size，值为 0..size-1
  difficulty: 0 | 1 | 2 | 3
  tips?: TutorialTip[] // tutorial 必填
}
```

## 约定

- 区域 ID 必须覆盖 `0..N-1`，不可缺号。
- 每个区域至少 1 格。
- 教学关 `difficulty === 0`，且 `tips.length >= 1`。
- `tips[].highlight` 若存在，坐标须在棋盘内。

## 校验

```bash
npm test
```

`validateLevel` / `hasSolution` 会检查结构与是否至少一解（DFS，适合 N≤8）。

## 禁止

- 无解盘面
- 区域编号越界或空洞
- 教学关缺少 tips
