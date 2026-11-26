# Directions · 设计方向样张

> 9 套真实可点的方向样张；新视觉任务先从这里挑 3 个做初稿。
> 协议：`../DIRECTION.md`；预览：`index.html`。

| 方向 | 适合 | 字体 |
|---|---|---|
| `editorial-warm` | 品牌 / 内容 / 作品集 | Fraunces + Noto Serif SC |
| `editorial-ink` | 出版 / 文化 / 酒店 | Playfair + Noto Serif SC |
| `gallery-swiss` | 工作室 / 摄影 / SaaS | Inter |
| `gallery-brutalist` | 独立杂志 / 活动 / 实验品牌 | JetBrains Mono |
| `deep-terminal` | DevTool / AI 基础设施 / 监控 | JetBrains Mono |
| `deep-aurora` | AI / 创作者工具 / 夜间 | Space Grotesk |
| `old-heritage` | 酒店 / 地产 / 财经 | Playfair + Noto Serif SC |
| `old-luxe` | 会员制 / 高端服务 / 限量 | Playfair |
| `soft-care` | 健康 / 教育 / 日常工具 | Inter |

## 生成 3 个方向

```bash
node scripts/direction.mjs \
  --title "Northwind 改版" \
  --copy "把产品、增长与收入数据放进同一块看板。" \
  --slug northwind
```

输出 `directions/runs/<日期>-<slug>/`：3 个真实 HTML + 入口 + `DIRECTIONS.md`。
用户选定后写 `direction-approved.md`，再进入 `design.json`。

## 规则

- 3 个方向不要同一家族
- 先看题材，再选风格
- 样张是起点，不是唯一答案；可以拆、改、混
- 方向阶段不做完整实现
