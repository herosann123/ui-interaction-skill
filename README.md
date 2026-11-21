# UI Interaction Skill

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
- **7 套可运行页面**：`templates/`
  - demo-shell / hero / feature-grid / ai-chat / mobile-feed / mobile-detail / dashboard
- **32 条体检规则**：`scripts/audit.mjs`
- **完整协议**：`AUDIT.md` / `DEMO.md` / `ITERATE.md`
- **自检**：`scripts/check.mjs` + `tests/fixtures/`

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
├── SKILL.md                 # 主入口：四模式路由 + 核心决策
├── AUDIT.md / DEMO.md / ITERATE.md
├── PATTERNS.md / INDEX.md   # 56 模式代码与速查
├── references/              # 映射 / 反模式 / 性能预算全文
├── library/                 # motion-kit + manifest
├── templates/               # 7 套页面
├── scripts/                 # audit / new-demo / bundle / check
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
