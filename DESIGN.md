# 设计定调 · DESIGN 协议

> 在写页面 / 选动效 / 做 demo 之前，先把「气质、密度、骨架、排版、颜色、状态」定下来。
> 输出不是一篇设计说明，而是一份可执行的 `design.json` + 对应 tokens。

---

## -1. 上游（新视觉任务）

- **方向未定**：先走 `DIRECTION.md` 的三方向门，生成 3 个真实方向。
- **涉及品牌**：先走 `BRAND.md`，拿到真实 logo / 产品图 / UI 截图。
- 方向和品牌确定后，再回到本协议生成 `design.json`。

## 0. 输出契约

```text
design.json          # 8 项决策
design-core/         # tokens / typography / layout
DESIGN.md            # 本协议
```

`design.json` 示例：

```json
{
  "title": "Northwind Analytics",
  "archetype": "editorial",
  "density": "normal",
  "layout": "landing",
  "typeScale": 1.25,
  "accent": "#b4552f",
  "motionBudget": { "primary": 2, "secondary": 1 },
  "states": ["default", "hover", "focus", "active", "disabled", "loading", "error", "success"],
  "verify": { "viewports": [390, 768, 1280], "reducedMotion": true }
}
```

---

## 1. 选气质（只选一个）

| archetype | 关键词 | 适合 | 不适合 |
|---|---|---|---|
| `editorial` | 温暖 / 人文 / 手作 / 编辑 | 品牌页、邀请函、作品集、内容产品 | 强科技感、数据密集后台 |
| `gallery` | 克制 / 专业 / 建筑 / 极简 | 工作室、摄影、SaaS 官网 | 需要强情绪/节庆感的页面 |
| `deep-space` | 未来 / AI / 开发者 / 夜间 | DevTool、AI 产品、夜间后台 | 温暖生活方式品牌 |
| `old-money` | 传承 / 品味 / 稳重 | 酒店、品牌、财经、高端地产 | 年轻潮流、促销 |

含糊时选 `gallery`。**不要混两个 archetype**；混搭 = 都不像。

---

## 2. 选密度与骨架

| density | 间距 | 适合 |
|---|---|---|
| `tight` | 4/8/12/16/24/32/48 | 仪表盘、工具、数据密集 |
| `normal` | 8/16/24/32/48/64/96 | 大多数营销页、官网 |
| `loose` | 12/24/36/48/72/96/144 | 高端品牌、画廊、留白型 |

| layout | 骨架起点 | 何时不用 |
|---|---|---|
| `landing` | 单列叙事 + 全宽 Hero + 交替节奏 | 内容是并列比较时改网格 |
| `reading` | 单列 68ch + 目录侧栏（≥1024） | 图文集改错落网格 |
| `flow` | 窄单列 ≤480px + 分步 | 后台大表单改分区 |
| `dashboard` | 顶栏 + 侧栏 + auto-fit 卡片 | 阅读内容混入时降密度 |
| `gallery` | 错落网格 / 横向叙事 | 强线性叙事时不用 |
| `app` | 全屏栈 + 底部 Tab | 需要大屏对照时不用 |

先回答三个问题：**第一眼必须看到什么？阅读动线是线性/并列/探索？一屏 3 个还是 30 个元素？**

---

## 3. 排版与颜色

### 排版

- 字号比 1.25；全页 ≤7 级。
- 字重对比 > 字号对比 > 字距对比。
- Eyebrow：10–11px + 0.24–0.4em 字距 + uppercase。
- 正文 14–15px，行高 1.7–1.9；行长 45–75ch。
- 数字 `tabular-nums`；中文不用伪斜体。
- 字族 ≤2（+1 mono）；CJK fallback 写全。

### 颜色

- 不用纯黑/纯白；用带色温的 bg/ink。
- 文字层级用同一 ink 的 72% / 52% 透明度。
- accent 每屏 ≤2 处，面积 ≤10%。
- 正文对比 ≥4.5:1；大字/UI ≥3:1。
- 阴影用 ink 色低透明度；描边、阴影、渐变三选一。

执行细节见 `design-core/rules.md`。

---

## 4. 组件状态

在写任何组件前，先列出 8 态里哪些存在：

`default / hover / focus / active / disabled / loading / error / success`

- hover 仅 `hover:hover` 设备；触摸端用按压。
- focus 必须有 `:focus-visible` 焦点环。
- 错误 = 颜色 + 文字 + 图标；文字说“怎么修”。
- 提交中 loading + 防重。
- 页面异步视图必须有 `loading / content / empty / error` 四态。

---

## 5. 动效预算

- 一屏 ≤2 个主模式 + 1 个次要模式。
- 每个动效必须有 `prefers-reduced-motion` 静态版。
- 动效选择查 `SKILL.md` §4 / `references/mapping.md`；先过减法表。
- 页面整体预算写在 `design.json.motionBudget`，实现时不要超。

---

## 6. 应用到页面

```html
<link rel="stylesheet" href="design-core/tokens.css">
<link rel="stylesheet" href="design-core/typography.css">
<link rel="stylesheet" href="design-core/layout.css">
<link rel="stylesheet" href="library/motion-kit.css">

<html data-theme="editorial" data-density="normal">
  <main class="d-container d-section">
    <p class="d-eyebrow">Analytics Platform</p>
    <h1 class="d-display">把数据变成<br>真正的决策</h1>
    <p class="d-prose">……</p>
  </main>
</html>
```

- 页面自己的颜色/字体只引用变量，不硬编码。
- 需要新 token 时先加到 `design-core/tokens.json` 与 `tokens.css`，再使用。
- 组件复用 `components/`；动效复用 `library/motion-kit`。

---

## 7. 验证

- `node scripts/design-lint.mjs`：对比度、间距、字号层级、状态选择器。
- `node scripts/audit.mjs`：动效/性能/可访问性。
- `node scripts/smoke.mjs` / `verify`：视口矩阵 + reduced-motion + 溢出 + 键盘。
- 视觉评审：`CRITIQUE.md` + `scripts/critique.mjs`（6 维、证据、四态）。
- 结论四态：✅ / ❌ / ⚠️ / ➖。

---

## 8. 交接

- 给 `AUDIT.md`：design.json + 目标视口 + 必须保留的品牌/内容。
- 给 `DEMO.md`：design.json + 选中改动 + 内容约束。
- 给 `ITERATE.md`：这轮改的是气质、布局、组件状态还是动效；下一轮不要重复定调。
- 给 `ui-visual-skill` / `ui-layout-skill` / `ui-component-skill` / `ui-verify-skill`：需要完整方法论时再读原文。

---

## 9. 非目标

- 不替代完整品牌设计 / 用户研究。
- 不生成图片/视频资产。
- 不把 4 套 archetype 变成唯一审美；它们只是安全起点。
- 不为了“看起来高级”牺牲可读性、对比度与真实内容。
