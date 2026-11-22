# 页面模板

> 可直接双击打开的完整 HTML；依赖只有 `../library/motion-kit.css` 与 `.js`。
> 模板是**改版起点**，不是最终交付：内容 / 品牌 / 文案必须换成用户的真实内容。

---

## 1. 清单

| 模板 | 展示的模式 | 适合的改版 |
| --- | --- | --- |
| `demo-shell/` | ① ② ④ ⑤ ⑧ ⑨ ⑬ ㉖ ㉜ 53 | **Before/After/Split 对照壳**；`new-demo` 默认模板。完整案例：`demo-shell/CASE-STUDY.md`。`before.html` 是一个故意堆满反例的页面，`after.html` 是同一内容的升级版 |
| `hero/` | ① ② ④ ⑤ ⑥ ⑧ ⑨ ⑬ ㉜ | 落地页首屏 / 产品发布页：分层视差、词级揭示、磁吸 CTA、SVG logo 描边 |
| `feature-grid/` | ② ⑦ ⑧ ⑨ | 定价页 / 特性网格：3D 倾斜、月付年付开关、数字滚动 |
| `ai-chat/` | ⑩ ⑫ ⑰ ㉜ | AI 产品 / Copilot：流式打字、玻璃输入区、可暂停粒子背景 |
| `mobile-feed/` | ㉖ ㉚ ㉛ ㉜ ㊶ ㊻ ㊼ | 手机信息流：snap 轨道、滑动行、双击点赞、评论抽屉、骨架屏、角标 |
| `mobile-detail/` | ㉗ ㉙ ㉚ ㉟ ㊲ ㉜ | 手机列表→详情：push/pop、左缘滑动返回、坍缩头图、下拉刷新 |
| `dashboard/` | ⑧ ⑩ ㉓ ㉘ ㊹ | 工具型后台：⌘K 命令栏、scroll-snap Tabs、数字卡、圆形主题揭示 |
| `checkout/` | ② ⑧ ⑬ ㉜ | 结算流：步骤、配送/支付选项、订单摘要、支付成功态 |
| `settings/` | ② ㉘ ⑩ ㉜ | 设置页：分区 Tabs、表单、开关、保存栏、安全/账单 |

完整 56 种模式 → 见 `../INDEX.md`；每个模式的实现代码 → `../PATTERNS.md`；kit 支持范围 → `../library/manifest.json`。

---

## 2. 直接试玩

```bash
# 从 skill 根目录
start templates/demo-shell/index.html        # Windows
open  templates/demo-shell/index.html        # macOS
```

`demo-shell/index.html` 键盘操作：

- `1` Before · `2` After · `3` Split
- `D` 切换 390px 移动视图
- `N` 开关右侧改动说明
- 每个 pane 右下角可单独打开页面

---

## 3. 用脚手架生成一个改版目录

```bash
node scripts/new-demo.mjs \
  --name northwind-refresh \
  --title "Northwind 官网改版" \
  --template hero \
  --before ./old-index.html \
  --patterns "①,⑤,④,⑬,⑨"
```

输出：

```
ui-runs/20261120-northwind-refresh/
├── index.html          # Before / After / Split 对照壳
├── before.html         # 原页面（--before 或占位页）
├── after.html          # 改版页面（模板）
├── assets/
│   ├── motion-kit.css
│   └── motion-kit.js
├── manifest.json       # 模板、来源、模式、版本
├── CHANGELOG.md        # v1 记录
└── NOTES.md            # 交付自查
```

生成后按 `../DEMO.md` 替换内容、更新改动说明；按 `../ITERATE.md` 版本化修改。
交付建议加 `--blank`：before/after 都是占位，避免把 Northwind 示例内容当成用户成果。

---

## 4. 模板改造规则

### 必须

1. **Before 与 After 使用同一份内容**：标题、卖点、数据、评价、FAQ 不新增也不删；只改交互、层级与质感。
2. **所有文案换成用户真实内容**；没有内容就标注「占位」，不要编造客户/数据。
3. **保留 reduced-motion**：模板已经处理，不要为了「更炫」删掉 `@media (prefers-reduced-motion)`。
4. **触摸端不启用 hover-only**：磁吸 / 倾斜 / 自定义光标只在精细指针下启用。
5. **不丢功能**：原页面有的入口（返回、关闭、收藏、提交）在 After 里必须仍然可达。

### 建议

- 一屏最多 2 个主模式 + 1 个次要模式（见 `SKILL.md` §6）。
- 文案、按钮、表单保持真实语义；不要用「Lorem ipsum」。
- 移动端 390px 先过一遍：无横向滚动、输入字号 ≥16px、抽屉内容可滚。
- 图片优先用用户素材；没有就使用 CSS 渐变 / 内联 SVG，并标注占位。
- 动效只动 `transform` / `opacity`；高度展开用 `grid-template-rows`。

### 禁止

- 用 `setInterval` 强制轮播 / 翻页。
- 在触摸端做磁吸或固定 `transform-origin: center` 的 pinch。
- 把删除 / 返回 / 关闭做成唯一手势入口。
- 为了视觉新增营销数据、客户 logo、评分。
- 在 `before.html` 里混入改版代码（对照会失真）。

---

## 5. 自检清单

- [ ] 双击 `index.html`，Before / After / Split 都能加载，无控制台报错。
- [ ] 390px 视口无横向溢出；底部按钮不被地址栏遮挡（`100dvh`）。
- [ ] `prefers-reduced-motion: reduce` 下所有内容可见、动效停止。
- [ ] 键盘：Tab 能到所有操作；弹层 Esc 可关；焦点返回触发按钮。
- [ ] 改动说明与实际改动一致；manifest 的 `patterns` 更新。
- [ ] `node ../scripts/audit.mjs <用户源码>` 的 P0 项已处理，P1 项有结论。
- [ ] 改过库 / 模板后，`node ../scripts/check.mjs` 通过（语法 + 体检回归 + fixtures）。
