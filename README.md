# 咕叽咕叽 / Goojee

彩色区域皇后谜题微信小程序（原生 + TypeScript）。

- 中文名：咕叽咕叽
- 英文名：Goojee（音译 goo-jee）

## 本地运行

1. 安装依赖：

```bash
npm install
npm test
```

2. 用[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)打开本目录 `C:\src\New2`。
3. AppID 可使用测试号 / 游客模式（`project.config.json` 中为 `touristappid`）。

## 目录

| 路径 | 说明 |
|------|------|
| `pages/` | 首页、关卡列表、游戏页 |
| `components/board` | 棋盘 |
| `components/coach-tip` | 教学气泡 |
| `utils/` | 规则、校验、进度、教学流 |
| `data/levels.ts` | 教学关 + 正式关 |
| `docs/` | 玩法 / 关卡编写 / 关键验收 |
| `__tests__/` | Jest 单测 |

## 测试

```bash
npm test
```

规则、关卡可解性、教学元数据、进度/跳过均由自动化覆盖。手验仅见 [docs/acceptance.md](docs/acceptance.md)。

## Security Notes

- 无服务端、无鉴权、无 PII；进度仅本地 Storage（Public）
- 关卡为静态数据，无动态代码执行
- 本 MVP 无网络请求
