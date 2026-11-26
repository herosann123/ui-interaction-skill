# UI Interaction Skill

**在线演示**：https://herosann123.github.io/ui-interaction-skill/


一套面向 agent 的 **UI 交互工作台**：查模式、审代码、生成 Before/After 可运行改版、按反馈迭代。

它不是一份“动效清单”，而是把选型、体检、实现、验收串成一条可交付的链路。

## 能做什么

| 模式 | 输入 | 产物 |
|---|---|---|
| **A 选型 / 解释** | “Hero 用什么交互？”“解释 ㉑” | 四层推荐：必须 / 推荐 / 可选 / 禁止 + 模式编号 + 代码位置 |
| **B 代码体检** | 前端源码路径 | `audit.md`：P0/P1/P2 + `file:line` + 推荐模式 + 3–5 条改动 |
| **C 改版 Demo** | 体检结论 / 明确改动 | `ui-runs/<日期>-<名字>/`：Before / After / Split 可运行对照 |
| **D 反馈迭代** | “按钮再轻一点 / 不要这个 / 换成 X” | `versions/after-vN.html` + `CHANGELOG.md`，可回滚 |

## 内置资产

- **56 种交互模式**：基础 10 + 进阶 7 + 前沿 8 + 手机手感 7 + 高级手感 8 + 组件情绪 8 + 前沿 CSS 8
- **18 个零依赖行为**：`library/motion-kit.js` / `.css`
  - reveal / stagger / parallax / magnetic / tilt / ripple / counter / stream / dialog / sheet / tabs / swipe-row / cmdk / haptic / toast / bump / flip / animateValue
- **9 套可运行页面**：`templates/`
  - demo-shell / hero / feature-grid / ai-chat / mobile-feed / mobile-detail / dashboard / checkout / settings
- **Design Core**：`design-core/`（4 套 archetype / type scale / spacing / 组件 8 态）
- **4 套主题**：`presets/`（editorial / glass / soft）
- **5 组组件**：`components/`
  - buttons / feedback / forms / navigation / data
- **32 条体检规则**：`scripts/audit.mjs`
- **完整协议**：`AUDIT.md` / `DEMO.md` / `ITERATE.md`
- **自检**：`scripts/check.mjs` + `tests/fixtures/`
- **浏览器验收**：`scripts/smoke.mjs`（390/768/1280 + reduced-motion + 溢出 + 44px 目标 + 控制台错误）
- **截图**：`scripts/screenshot.mjs`（案例 / 对比图 / 交付截图）
- **自动化**：`scripts/brief.mjs` / `scripts/iterate.mjs` / `scripts/sanitize.mjs`
- **框架适配**：`library/motion-kit.esm.js`、`motion-kit.d.ts`、`adapters/react.js`、`adapters/vue.js`
- **主题预设**：`presets/editorial.css` / `glass.css` / `soft.css`

## 设计定调

写页面前先定 `design.json`：archetype / density / layout / type scale / accent / motion budget / states / verify。
```bash
node scripts/design-brief.mjs --archetype editorial --density normal --layout landing --out design.json
node scripts/design-lint.mjs
```
详见 `DESIGN.md` 与 `design-core/README.md`。

## 设计方向 / 品牌 / 评审

- **9 套方向样张**：`directions/index.html`；先选 3 个方向再做第一版
- **方向生成**：`scripts/direction.mjs --title "..." --copy "..." --slug name`
- **品牌协议**：`BRAND.md` + `brand/brand.schema.json` + `scripts/brand-check.mjs`
- **6 维评审**：`CRITIQUE.md` + `scripts/critique.mjs`
- **导出**：`scripts/export.mjs`（HTML → PDF / PNG）
- **模板迁移状态**：`design-core/MIGRATION.md`
- **外观账本**：`scripts/design-ledger.mjs`（避免每个项目都长同一套）

## 案例

- 案例/能力画廊：[cases/index.html](cases/index.html)
- Northwind Before/After：`templates/demo-shell/`

## 方向 / 品牌 / 评审

- **9 套方向样张**：`directions/index.html`
- **生成 3 个方向**：`node scripts/direction.mjs --title "..." --copy "..." --slug name`
- **品牌资产**：`BRAND.md` + `scripts/brand-check.mjs`
- **6 维评审**：`CRITIQUE.md` + `scripts/critique.mjs`
- **导出**：`scripts/export.mjs`（HTML → PDF / PNG）
- **模板迁移状态**：`design-core/MIGRATION.md`
- **外观账本**：`scripts/design-ledger.mjs`

## 完整案例

- **Northwind Analytics Before / After**：`templates/demo-shell/`
- 图文说明：`templates/demo-shell/CASE-STUDY.md`
- 在线试玩：https://herosann123.github.io/ui-interaction-skill/templates/demo-shell/

## 快速开始

### 安装为 Claude Code / ZCode 技能

```bash
git clone https://github.com/herosann123/ui-interaction-skill.git
cp -R ui-interaction-skill ~/.claude/skills/ui-interaction-skill
```

或放到项目的 `.claude/skills/ui-interaction-skill`。

### 直接打开 demo

```bash
open templates/demo-shell/index.html      # macOS
start templates/demo-shell/index.html     # Windows
```

快捷键：`1` Before · `2` After · `3` Split · `D` 390px · `N` 改动说明。

### 体检你的项目

```bash
node scripts/audit.mjs ./src --out ui-runs/my-app/audit.md
node scripts/audit.mjs ./src --json --out ui-runs/my-app/audit.json
```

支持 HTML / CSS / JS / JSX / TSX / Vue / Svelte / Astro / 小程序 WXML / WXSS。
会跟随 HTML 的本地 CSS/JS 与 CSS `@import`，跳过构建产物与压缩文件。

### 从体检 JSON 到 brief

```bash
node scripts/audit.mjs ./src --json --out ui-runs/my-app/audit.json
node scripts/brief.mjs --in ui-runs/my-app/audit.json --out ui-runs/my-app/brief.md --max 5
node scripts/new-demo.mjs --name my-refresh --title "我的改版" --blank   --from-audit ui-runs/my-app/audit.json
```

### 迭代与脱敏

```bash
node scripts/iterate.mjs --run ui-runs/my-refresh --note "CR-1：CTA 收敛"
node scripts/sanitize.mjs --in old.html --out old.safe.html
```

### 生成改版对照

```bash
# 空白骨架（推荐交付用）
node scripts/new-demo.mjs --name my-refresh --title "我的改版" --blank

# 用模板 + 真实 before
node scripts/new-demo.mjs --name pricing --title "定价页改版" \
  --template feature-grid --before ./old-pricing.html

# 单文件分享
node scripts/bundle-demo.mjs --in ui-runs/.../after.html
```

### 自检

```bash
node scripts/check.mjs
```

覆盖：JS / inline script 语法、manifest、clean after 体检、模板 P0、规则 fixtures、150 个文档路径。

## 目录

```text
.
├── index.html               # GitHub Pages / 本地演示首页
├── DESIGN.md                # 设计定调协议（design.json）
├── DIRECTION.md             # 三方向门
├── BRAND.md                 # 品牌资产协议
├── CRITIQUE.md              # 6 维视觉评审
├── design-core/             # tokens / typography / layout / rules
├── directions/              # 9 套方向样张 + 生成脚本输出
├── cases/                   # 案例/能力画廊
├── brand/                   # 品牌资产协议 / schema / 示例
├── SKILL.md                 # 主入口：四模式路由 + 核心决策
├── AUDIT.md / DEMO.md / ITERATE.md
├── PATTERNS.md / INDEX.md   # 56 模式代码与速查
├── references/              # 映射 / 反模式 / 性能预算全文
├── library/                 # motion-kit + manifest
├── components/              # 5 组可复制组件
├── presets/                 # 4 套主题令牌 + 预览
├── templates/               # 9 套页面
├── scripts/                 # audit / new-demo / bundle / check / smoke / brief / iterate / sanitize
├── tests/fixtures/          # 体检规则回归样例
├── examples/                # 体检报告 / demo brief / 迭代记录
└── evals/                   # 对抗性行为评测场景
```

## 质量底线

- 每个动效都有 `prefers-reduced-motion` 静态版
- 触摸拖拽有 `touch-action` + `pointercancel`
- hover-only 行为用能力检测门控
- Before / After 使用同一份文案与信息结构
- 每条体检结论都有 `file:line`
- 迭代有版本、有 CHANGELOG、可回滚

## 已知边界

- 静态扫描是启发式，不能替代真实浏览器验收
- 没有截图就不做视觉评分
- 不会编造品牌 / 客户 / 数据
- 行为评测需要独立宿主执行，见 `evals/scenarios.md`

## License

MIT
