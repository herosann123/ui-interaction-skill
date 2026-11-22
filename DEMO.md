# 改版 Demo 生成 · DEMO 协议

> 目标：把 AUDIT 选出的 3–5 个改动，做成一个**能打开、能对照、能继续改**的 Before/After demo。
> 不是重做整个产品；是让用户在同一份内容下，直接感受交互与质感的差异。

---

## 0. 输出契约

一个 run 目录：

```
ui-runs/<YYYYMMDD>-<slug>/
├── index.html          # 对照壳：Before / After / Split + 390px + 改动说明
├── before.html         # 原页面（或忠实复刻）
├── after.html          # 改版页面
├── assets/
│   ├── motion-kit.css
│   └── motion-kit.js
├── manifest.json       # 来源、模板、模式、版本
├── CHANGELOG.md        # v1 记录；每次反馈追加
├── NOTES.md            # 交付前自查
└── versions/           # 迭代时保存 after-vN.html（第一次修改后创建）
```

默认可直接双击 `index.html`，不需要构建、不需要服务器。

---

## 1. 输入

| 输入 | 必需 | 说明 |
| --- | --- | --- |
| 源码 / 页面 | 是 | 路径或粘贴的 HTML / 组件；用于生成 before 与提取文案 |
| 选中的 findings | 是 | 来自 `AUDIT.md` §6；没有就先做体检 |
| 必须保留 | 是 | 文案、品牌色、logo、埋点、业务入口 |
| 技术栈 | 推荐 | demo 默认纯 HTML；用户要 React/Vue 时按栈输出 |
| 设备 / 浏览器 | 推荐 | 默认桌面 + 390px |
| 依赖限制 | 可选 | 默认零依赖；GSAP 仅在模式确实需要时用 CDN 并锁版本 |
| 交付形态 | 可选 | 默认 run 目录；需要单文件时跑 `bundle-demo.mjs` |

**不要**在信息不足时编造：品牌、客户 logo、评分、统计数字、评价。
没有真实内容就用明显标注的占位，并在 NOTES 里写「待替换」。

---

## 2. 选改动：3–5 个，不多不少

优先级：

1. **P0**：reduced-motion、永久不可见、键盘不可达、触摸必断。
2. **主路径 P1**：首屏、主 CTA、核心列表、最高频弹层。
3. **一个「啊哈」时刻**：让用户一眼看到差异的交互（如轮播换 snap、卡片加倾斜）。
4. **一个克制的收尾**：数字/角标/成功反馈，证明细节。

不建议一次塞 8 个模式：

- 同屏 >4 个动效源 → 视觉噪声；
- 改动越多，反馈越难归因；
- demo 是决策工具，不是作品集。

---

## 3. 生成

```bash
# 空白骨架（推荐交付用；before/after 都是占位）
node scripts/new-demo.mjs --name my-refresh --title "我的改版" --blank

# demo-shell + Northwind 示例（适合先看效果；交付前必须替换内容）
node scripts/new-demo.mjs --name northwind --title "Northwind 改版"

# 指定模板与真实 before
node scripts/new-demo.mjs \
  --name pricing-refresh \
  --title "定价页改版" \
  --template feature-grid \
  --before ./old-pricing.html \
  --patterns "⑨,⑦,⑧,②"

# 已经写好 after
node scripts/new-demo.mjs --name x --after ./new-page.html --before ./old-page.html
```

可用模板见 `templates/README.md`；模板只提供骨架，**内容必须替换**。

生成后：

1. 用真实文案替换 `before.html` / `after.html`。
2. 保持两份页面信息结构一致（见 §4）。
3. 更新 `index.html` 右侧「改动说明」：每条写「改了什么 + 为什么 + 模式编号」。
4. 更新 `manifest.json` 的 `patterns` 与 `status`。
5. 跑 §7 自检。

> **本地资源**：脚手架只复制 HTML。如果原页面依赖本地 CSS / JS / 图片，先把页面另存为单文件（图片内联），
> 或把资源一起放到 `<run>/assets/` 并改相对路径；否则 iframe 里会出现样式缺失或 404。

---

## 4. 忠实度规则

### 必须保留

- **文案**：标题、副标题、CTA、价格、FAQ、评价原文。
- **信息架构**：区块顺序、导航项、表单字段、必需入口。
- **品牌**：主色、logo、字体气质（除非用户明确要求换）。
- **功能**：返回、关闭、提交、收藏、筛选、埋点。

### 允许改变

- 交互反馈、动效、层级、间距、圆角、阴影、表面处理。
- 同一内容的重排（在不丢信息的前提下）。
- 原生组件替换（如 `div` 弹层 → `<dialog>`）。
- 触摸端降级（hover 效果 → 按压/静态）。

### 禁止

- 新增原文没有的客户 logo、数据、评分、奖项。
- 把 Before 故意做丑来制造差距。
- 删掉 Before 里可用的功能来让 After「更简洁」。
- 在 demo 中调用真实支付 / 登录 / 用户数据。
- 把 `before.html` 当成第二个改版页。

> 判断标准：用户把两份页面并排看，应该相信「这是同一个产品，只改了体验」。

---

## 5. 实现规则

### 5.0 脱敏

用户页面可能夹带 API key、手机号、真实支付配置或第三方跟踪脚本。分享前：

```bash
node scripts/sanitize.mjs --in ui-runs/x/before.html --out ui-runs/x/before.safe.html
```

- 默认移除 `<script>`、`on*` 内联事件、`javascript:` URL 与外链 iframe
- 遮盖常见密钥（OpenAI / GitHub / Slack / AWS / Google）
- 需要保留交互脚本时加 `--keep-scripts`，并人工复核
- 脱敏后重新跑 `node scripts/audit.mjs before.safe.html` 和 `node scripts/smoke.mjs`

### 5.1 默认零依赖

- 优先 `library/motion-kit.css/js`。
- 长尾模式参考 `PATTERNS.md`；需要 GSAP 时用固定版本 CDN，并在 `NOTES.md` 写明。
- 不引入 UI 框架、字体 CDN、图标库（除非用户要求）。图片用用户素材或内联 SVG / CSS 渐变。

### 5.2 无障碍

- 每个动效都要有 `prefers-reduced-motion` 静态版。
- 入场元素只在 `html.mk-js` 时隐藏；库加载失败要恢复可见。
- 弹层用 `<dialog>`；抽屉保留 Esc、焦点返回、背景滚动锁。
- 手势不是唯一入口：滑动行保留「更多」按钮，返回保留可见按钮。
- 输入字号 ≥16px；焦点环 `:focus-visible` 可见。

### 5.3 性能

- 只动 `transform` / `opacity`；展开用 `grid-template-rows`。
- 滚动 / 指针用 rAF 合帧；监听 `passive: true`。
- 大 blur ≤24px；移动端更低；blur 层不叠 `mix-blend-mode`。
- 粒子 / 噪点离屏暂停；`visibilitychange` 停 rAF。
- 同屏动效源 ≤2 主 + 1 次。

### 5.4 移动端

- 先在 390px 宽检查，再检查桌面。
- 拖拽面 `touch-action: none/pan-y`；监听 `pointercancel`。
- hover-only 行为用 `matchMedia('(hover: hover) and (pointer: fine)')` 门控。
- 视口高度用 `100dvh`；底部操作留 safe-area。
- 横滑优先原生 `scroll-snap`，不要 JS 手写 pager。

### 5.5 框架适配

- demo 默认纯 HTML；如果用户项目是 React/Vue，交付时优先给**组件级代码片段**，而不是再做一个纯 HTML 页面。
- 保留 data-attribute 契约，在 `useEffect` / `onMounted` 里 `MotionKit.init(ref)`。
- 不要为了 demo 引入与用户项目冲突的全局样式；作用域化类名或 CSS Module。

---

## 6. 对照壳

`index.html` 已经实现：

- **Before / After / Split**：两个 iframe 常驻，切换不丢滚动位置。
- **390px**：单栏/分屏都可切移动视图。
- **改动说明**：右侧面板；生成后必须替换成本次改动。
- **快捷键**：`1/2/3`、`D`、`N`。
- **独立打开**：每个 pane 右上角可单独打开，便于截图。

编辑改动说明时，每条包含：

```html
<li class="change">
  <span class="change__num">01</span>
  <div>
    <b>一句话说清改了什么</b>
    <p><code>模式编号</code> + 为什么这样改 + 对用户的可感知收益。</p>
  </div>
</li>
```

「已移除 / 已修复」列表写**审计项**（如「删除 setInterval 每 3 秒翻页」），让用户看到问题被处理，而不只是视觉变好。

### 可选：页面内标注

After 页可以放小号 `pattern-chip`（模板里已有示例），标出模式编号。不要在每个元素上贴徽章；只在区块标题旁标一处。

---

## 7. 验证

### 自动 / 命令行

```bash
# 结构 / 链接检查
node scripts/audit.mjs ui-runs/<slug>/after.html --quiet

# 单文件分享
node scripts/bundle-demo.mjs --in ui-runs/<slug>/after.html \
  --out ui-runs/<slug>/after.standalone.html
```

### 浏览器（有条件时）

- 打开 `index.html`，看控制台无报错。
- 切 Before / After / Split，确认 iframe 都加载。
- 390px：无横向溢出，底部不被遮挡。
- 键盘：Tab 走完操作，Esc 关弹层，焦点返回。
- 系统开启「减少动态」：内容全部可见，动效停止。
- 移动端真机：滑动、返回、下拉刷新、抽屉拖拽。

没有浏览器截图 → 报告中写「未验证」，不要写「已适配」。

### 四态验收

| 状态 | 用于 |
| --- | --- |
| ✅ 通过 | 亲自看过 / 操作过 / 有截图 |
| ❌ 未通过 | 有反证：溢出、报错、键盘不可达 |
| ⚠️ 未验证 | 实现者声称已好，但没证据 |
| ➖ 不适用 | 本次范围外，写原因 |

---

## 8. 交接给 ITERATE

生成 demo 时的回复应包含：

- 目录路径 + 怎么打开；
- 这次改了什么（3–5 条）+ 对应模式；
- 哪些**没改**（以及为什么）；
- 已知风险 / 未验证项；
- 希望用户重点看的 2–3 个交互（便于收反馈）。

然后按 `ITERATE.md` 接收修改请求。

---

## 9. 单文件交付

用户要发微信 / 上传时：

```bash
node scripts/bundle-demo.mjs --in ui-runs/<slug>/after.html
# → ui-runs/<slug>/after.standalone.html
```

单文件会内联 motion-kit；图片若是外链则保持外链（在 NOTES 里说明）。

---

## 10. 常见失败

| 失败 | 后果 | 修正 |
| --- | --- | --- |
| Before 被做丑 | 用户不信任对比 | 还原原页面；只改 After |
| After 新增营销数据 | 用户无法直接采用 | 只保留原文案；占位明确标注 |
| 8 个模式同屏 | 噪声 / 掉帧 | 删到 2 主 + 1 次 |
| 手势唯一入口 | 可访问性崩 | 保留可见按钮 |
| 无 reduced-motion | P0 返工 | 库已内置；不要删 |
| 只给截图不给可运行文件 | 无法继续迭代 | 交付 run 目录 / 单文件 |
| 改动说明写成设计宣言 | 用户抓不到重点 | 每条写「改了什么 → 为什么 → 收益」 |
