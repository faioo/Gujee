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

## 约定（校验强制）

- 区域 ID 必须覆盖 `0..N-1`，不可缺号。
- **唯一解**：`countSolutions(regions) === 1`。
- **开局线索**：至少 1 个区域格子数恰好为 1（单格色块）。
- **同色连通**：同一区域的格子必须四连通（上下左右相邻成一块，不允许飞地）。
- 教学关：`difficulty === 0`，`size <= 4`，且 `tips.length >= 1`。
- `tips[].highlight` 若存在，坐标须在棋盘内，并应对应该关唯一解的引导步。

## 校验

```bash
npm test
```

`validateLevel` 会检查结构、单格线索、区域连通性、唯一解（DFS，N≤8；计数上限 2 即可判定唯一性）。

辅助脚本：

- `node scripts/gen-connected-levels.js` — 生成连通 + 单格 + 唯一解盘面
- `node scripts/gen-unique-levels.js` / `gen-hard-unique.js` — 历史生成脚本（新关请优先用 connected 版）

## 禁止

- 无解或多解盘面
- 没有单格区域的盘面
- 同色区域不连通（飞地）
- 区域编号越界或空洞
- 教学关缺少 tips，或教学关大于 4×4
