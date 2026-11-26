# Design Core

> 排版、色彩、布局、组件状态的**可执行核心**。
> 本地 `ui-visual-skill` / `ui-layout-skill` / `ui-component-skill` / `ui-verify-skill`
> 仍是完整方法论；这里是它们的最小可执行子集，避免把长文搬进本 skill。

## 文件

| 文件 | 作用 |
|---|---|
| `tokens.json` | 机器可读：4 套 archetype / type scale / spacing / layout / states |
| `tokens.css` | 4 套 `[data-theme]` + 3 档 `[data-density]` + `--mk-*` 桥接 |
| `typography.css` | `.d-display / .d-h1... / .d-prose / .d-eyebrow / .d-num` |
| `layout.css` | `.d-container / .d-section / .d-stack / .d-grid / .d-flow / .d-card` |
| `rules.md` | 5 条底线 / 3 个决策问题 / 8 态 / 四态 / 验收矩阵 |
| `brief.schema.json` | `design.json` 的 JSON Schema |
| `examples/editorial.json` | 可直接用的 design brief 示例 |

## 预览

打开 `design-core/index.html` 看 4 套 archetype、type scale、spacing 与布局工具。

## 快速开始

```html
<link rel="stylesheet" href="design-core/tokens.css">
<link rel="stylesheet" href="design-core/typography.css">
<link rel="stylesheet" href="design-core/layout.css">
<link rel="stylesheet" href="library/motion-kit.css">

<html data-theme="editorial" data-density="normal">
<body>
  <main class="d-container d-section">
    <p class="d-eyebrow">Analytics Platform</p>
    <h1 class="d-display">把数据变成<br>真正的决策</h1>
    <p class="d-prose">……</p>
  </main>
</body>
```

- `data-theme`：`editorial` / `gallery` / `deep-space` / `old-money`；默认 editorial。
- `data-density`：`tight` / `normal` / `loose`；决定 `--sp-1..7`。
- 颜色/字体变量会同时映射到 `--mk-*`，`motion-kit` 组件自动跟随。

## 四套 archetype

| archetype | 气质 | 适合 |
|---|---|---|
| `editorial` | 奶油纸 + 赤陶 + 衬线 | 品牌页 / 作品集 / 内容产品 |
| `gallery` | 暖白 + 炭黑 + 朱砂一点 | 工作室 / 摄影 / SaaS |
| `deep-space` | 近黑蓝 + 薄荷 + 暗金 | AI / DevTool / 夜间后台 |
| `old-money` | 米白 + 墨绿 + 旧金 | 酒店 / 品牌 / 财经 |

选一个，不要混。气质含糊时用 `gallery`（最安全）。

## token 一览

- 类型：`--fs-display` / `--fs-h1` / `--fs-h2` / `--fs-h3` / `--fs-body` / `--fs-small` / `--fs-tag`
- 行高：`--lh-display` / `--lh-heading` / `--lh-body` / `--lh-prose`
- 颜色：`--bg` / `--bg-2` / `--panel` / `--ink` / `--ink-72` / `--ink-52` / `--muted` / `--line` / `--accent` / `--accent-ink` / `--accent-2` / `--gold`
- 字体：`--font-display` / `--font-body` / `--font-mono` / `--display-weight` / `--display-tracking`
- 间距：`--sp-1..7`
- 形状：`--radius-sm` / `--radius` / `--radius-lg` / `--radius-pill`
- 阴影：`--shadow-1` / `--shadow-2`

## design brief

```bash
node scripts/design-brief.mjs --archetype editorial --density normal \
  --layout landing --accent "#b4552f" --out design.json
node scripts/design-brief.mjs --validate design.json
```

`design.json` 固定 8 项：archetype / density / layout / typeScale / accent / motionBudget / states / verify。
`new-demo --design design.json` 会把它写进 run 目录；`design-lint` 会校验 tokens 与组件状态。

## 规则

完整可执行摘要见 `rules.md`。三条最容易忘的：

1. 正文行长 45–75ch；`--prose: 68ch`。
2. 触控目标 ≥44×44；间距只能来自同一档 scale。
3. accent 每屏 ≤2 处；正文对比 ≥4.5:1。

## 与本地 skill 的关系

- 这里是**执行摘要 + tokens**；完整解释在 `ui-visual-skill` / `ui-layout-skill` / `ui-component-skill` / `ui-verify-skill`。
- 不复制它们的全部长文；本目录是唯一 token 真相源，原 skill 作为上游阅读。
