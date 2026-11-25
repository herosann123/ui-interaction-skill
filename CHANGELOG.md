# CHANGELOG · ui-interaction-skill

## v3.2.0 · 2026-11-25

### Design Core

- `DESIGN.md`：设计定调协议（archetype / density / layout / typeScale / accent / motionBudget / states / verify）。
- `design-core/`：
  - `tokens.json` / `tokens.css`：4 套 archetype（editorial / gallery / deep-space / old-money）、3 档 density、type scale、ink 阶梯、`--mk-*` 桥接。
  - `typography.css` / `layout.css`：`.d-display/.d-prose/.d-eyebrow` 与 `.d-container/.d-grid/.d-flow`。
  - `rules.md`：5 条布局底线 / 3 个决策问题 / 8 态 / 页面四态 / 验收矩阵。
  - `brief.schema.json` + `design-core/examples/editorial.json`。
  - `index.html`：4 套气质与排版/间距/布局预览。
- `scripts/design-brief.mjs`：生成 / 校验 `design.json`。
- `scripts/design-lint.mjs`：tokens 对比度、type scale、spacing、CJK fallback、组件状态、design.json 合法性。
- `new-demo --design design.json`：复制 design-core，注入 `data-theme` / `data-density`，写入 manifest。
- `presets/` 改为 design-core 的兼容别名（4 套 archetype + glass/soft 旧别名）。
- `components/STATES.md`：8 态矩阵 / 表单规则 / 页面四态。
- `smoke.mjs`：多视口 390/768/1280、元素级溢出、44px 触控目标、Markdown 报告；`smoke.yml` 同步。
- `check.mjs`：增加 Design Core 结构、design-lint、design-core 页面检查。

## v3.1.0 · 2026-11-22

### 新增

- **组件库 `components/`**：buttons / feedback / forms / navigation / data，5 组可复制组件 + 统一外壳；模板扩容到 9 套（新增 checkout、settings）。
- **主题 Preset `presets/`**：editorial / glass / soft 三套 `--mk-*` 令牌 + 预览页。
- **框架适配**：`motion-kit.esm.js`、`motion-kit.d.ts`、`adapters/react.js`、`adapters/vue.js`；`motion-kit.js` 增加 SSR no-op 分支，Node/Next 服务端不再访问 DOM。
- **自动化脚本**：
  - `scripts/brief.mjs`：audit JSON → demo brief
  - `scripts/iterate.mjs`：版本快照 + manifest/CHANGELOG 更新
  - `scripts/smoke.mjs`：零依赖 CDP 烟测（390px + reduced-motion + 控制台错误）
  - `scripts/sanitize.mjs`：移除脚本 / on* 事件 / javascript: URL，遮盖常见密钥
  - `new-demo --from-audit` / `--blank`：从体检自动选 3–5 项；空白骨架
- **体检器**：`--sarif`（GitHub Code Scanning）、`--baseline`（只报新增问题）、按文件的 touch-action、role/tabindex 键盘复核。
- **CI / Pages**：`.github/workflows/check.yml`、`smoke.yml`；根目录 `index.html` 演示导航首页。
- **完整案例**：`templates/demo-shell/CASE-STUDY.md` + 桌面/手机前后截图；`scripts/screenshot.mjs`。
- **自检**：check.mjs 覆盖 18 个页面、组件/presets、172 个文档路径；smoke 17 页通过。

### 说明

- `library/package.json` 只提供 exports 映射，方便复制/本地打包，不是已发布 npm 包。
- 行为评测仍需要独立宿主；本地 `check.mjs` 不替代行为评测。

## v3.0.0 · 2026-11-20

从「模式知识库 + 展示页」升级为「可审查 / 可生成 / 可迭代」的交互工作台。

### 新增

- **内置交互库** `library/`
  - `motion-kit.css` / `motion-kit.js`：零依赖，18 个行为（reveal / stagger / parallax / magnetic / tilt / ripple / counter / stream / dialog / sheet / tabs / swipe-row / cmdk / haptic / toast / bump / flip / animateValue）。
  - `manifest.json`：56 个模式 → demo / PATTERNS 章节 / kit 行为 / 移动端注意 / reduced 降级，机器可读。
  - `README.md`：data-attribute 表、JS API、CSS 组件、浏览器支持、扩展指南。
- **入口瘦身** `references/`：`mapping.md`（模块映射 / 56 模式速查 / 组合配方全文）与 `anti-patterns.md`（反模式 / 性能预算 / reduced fallback 全文）；`SKILL.md` 从 753 行压到约 460 行，description 从 613 字符压到 164 字符。
- **自检** `scripts/check.mjs` + `tests/fixtures/`：JS / inline script 语法、manifest、clean after 体检、模板 P0、规则 fixtures、文档本地链接。
- **页面模板** `templates/`
  - `demo-shell/`：Before / After / Split 对照壳 + 一份「反例 before → 升级 after」完整示例。
  - `hero/`、`feature-grid/`、`ai-chat/`、`mobile-feed/`、`mobile-detail/`、`dashboard/`、`checkout/`、`settings/`：9 套可运行页面。
  - `README.md`：模板清单、改造规则、自检清单。
- **代码体检** `AUDIT.md` + `scripts/audit.mjs`
  - 32 条规则，覆盖 reduced-motion、键盘语义、表单、触摸手势、布局动画、blur 性能、max-height 手风琴、setInterval 轮播等。
  - 输出 P0/P1/P2 + `file:line` + 推荐模式 + 置信度；支持 `--json`、`--out`、`--fail-on`。
  - 跟随 HTML 本地 `<link>` / `<script src>` 与 CSS `@import`；支持 `.html/.css/.js/.jsx/.tsx/.vue/.svelte/.astro/.wxml/.wxss`。
- **Demo 生成** `DEMO.md` + `scripts/new-demo.mjs`
  - 生成 `ui-runs/<日期-slug>/`：对照壳 / before / after / assets / manifest / CHANGELOG / NOTES。
  - `--before`、`--after`、`--template`、`--patterns`、`--blank`、`--single`、`--force`；`--blank` 生成空白 before/after 骨架。
  - `scripts/bundle-demo.mjs`：把 motion-kit 内联成单文件。
- **反馈迭代** `ITERATE.md`
  - CR 拆分、冲突分诊、版本化（`versions/after-vN.html`）、回滚、回复模板、四态验收。
- **示例** `examples/`
  - 反例体检报告（36 项）、从报告到 demo 的 brief、两轮反馈的 CR + CHANGELOG 示例。
- **SKILL.md / INDEX.md / evals**
  - §0 四模式路由（A 选型 / B 体检 / C demo / D 迭代）+ 资产地图 + 四条铁律。
  - §11.5–11.7 工作流摘要；§10 操作步骤按模式拆分。
  - 新增 10 个对抗性场景（无源码审查、扫描误报、无内容 demo、堆动效、删 reduced-motion、恢复 setInterval 轮播、密钥脱敏、框架错配、内容不一致、CSS-in-JS 局限）。

### 修复 / 调整（在模板与库自测中发现）

- 同一元素叠加多个行为时，原先共享的 `data-mk-bound` 会互相吞掉（例如 reveal + tilt 只生效一个）；改为按行为分别 `claim(el, key)`。
- Dashboard 的 Tab 面板缺少 `.mk-tabs__panel`，导致三个面板并排挤压；已补类名。
- 单文件打包时，库注释里的 `</script>` 会提前闭合内联脚本；`bundle-demo.mjs` 现在转义。
- 体检器单文件扫描会漏掉项目全局 CSS 的 reduced-motion；增加依赖跟随与按页判断。
- 体检器在 JSX/TSX 中不识别标签规则；增加 `jsx` kind。
- 移动端详情页用 `filter: brightness()` 过渡全屏层；改为 overlay opacity，避免滤镜过渡。
- 示例 CTA 磁吸在移动端自动退化；Haptics 在无用户激活时不调用 `vibrate`，避免控制台 intervention。
- 删除模板中动画 `box-shadow` / `width` 等布局属性，保证自身也过体检 P1。

### 第二轮自审修复

- `mobile-feed`：动态卡片的「⋯」原本没有绑定行为（不在滑动行内）；新增 `post-menu` 底部抽屉与 toast，分享按钮也有反馈。
- `mobile-detail`：分享 / 收藏原本无响应或错误打开筛选；改为 toast；筛选「查看结果」也有反馈；简介「四家小店」与 3 张卡片不一致，改为「三家小店」。
- `feature-grid`：月付/年付切换时左侧标签重复；改为静态两端标签，并只在用户切换时 bump 价格，避免首屏自动跳动。
- `dashboard`：键盘触发主题按钮时 `clientX/clientY` 为 0，圆形揭示会从左上角开始；改用按钮中心兜底。
- `library`：新增统一 `MotionKit.toast` / `data-toast`，模板不再各自维护 toast；`data-ripple` 现在自身保证 `position: relative; overflow: hidden`；`MotionKit.bump` 的「+N」改为挂在目标元素上，避免飞到未定位的父级；滑动行的手势清理不再每次手势累积。
- `audit`：`modern/custom-popover` 不再把任意 `.classList.contains()` 误判为 click-outside；`a11y/clickable-div` 会检查 role/tabindex 元素是否有键盘处理（P2）；`mobile/no-touch-action` 改为按文件判断，不再被另一个文件的 touch-action 掩盖。
- 新增 `.gitignore` 与 `.ui-audit.json`：忽略视频 / 历史打包 / 生成目录，避免自审与提交把 800MB 素材带进来。
- 将 `_video/`（722M）、`videos/`、参考视频、样图、旧 `github-upload/`、`pack-extracted/`、`_dist/`、旧压缩包与视频脚本移到 skill 外的 `../_ui-skill-archive-20261121/`；skill 体积从 819M 降到约 2.5M。

### 未包含

- 未把 56 种模式全部封装进 kit；长尾模式（粒子网络、Folding Drawer、按住说话、惯性甩动等）仍以 `PATTERNS.md` + 展示页为准，`manifest.json` 标注了 kit 支持范围。
- 历史视频 / 素材 / 旧打包目录已移到 `../_ui-skill-archive-20261121/`（可恢复，不随 skill 分发）；确认无用后可自行删除归档目录。
