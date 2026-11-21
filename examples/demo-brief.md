# 示例 · 从体检到 Demo 的交接 brief

> 输入：`templates/demo-shell/before.html` 的体检结果（见 `audit-report-before.md`）。
> 输出：`templates/demo-shell/after.html` 这个可运行改版。
> 真实项目照这个结构写 brief，再交给 `DEMO.md`。

---

## selected（本次只做 5 项）

### 1. Hero 首屏：从「静态大图 + hover 倾斜」到「分层入场」

- 证据：`before.html:242` — `onmousemove="tiltHero(event)"`，无 hover/pointer 门控；Hero 无滚动入场。
- 改动：`① 视差` 浮动指标卡 + `⑤ 词级揭示` 标题 + `②` 正文/CTA 依次入场；删除整块 hero 的 hover 倾斜。
- 收益：首屏信息 1 秒内建立层级；触摸端不再依赖不稳定的 mousemove。
- 风险：低；动效只作用于 Hero，不影响下方内容。
- 验证：桌面滚动时浮动卡速度不同；390px 无横向溢出；reduced-motion 下全部静态可见。

### 2. 主 CTA：从「无反馈按钮」到「桌面磁吸 + 移动按压」

- 证据：`before.html:74` / `:107` — `.btn { transition: all .3s linear }`，点击无水波纹/按压。
- 改动：`④ 磁吸（0.3）` + `⑬ 涟漪` + `㉜ 按压缩放/触感`；触摸端只保留按压与色变。
- 收益：主操作可感知；桌面跟手但不漂移；移动端不引入磁吸。
- 风险：低；磁吸位移限制在 ~10px。
- 验证：hover 跟手、pointerleave 复位；按下 0.96；reduced-motion 无位移。

### 3. 特性卡：从「hover 位移」到「3D 倾斜 + 径向高光」

- 证据：`before.html:107` — `.card:hover { transform: translateY(-4px) }`，整组卡片一起抖。
- 改动：`⑨ 3D 倾斜（±7°）` + `.mk-tilt-glow` 径向高光；仅精细指针启用。
- 收益：hover 有「光感」但不移动整张卡，视觉更稳；触摸端保持静态。
- 风险：低；需要 `transform-style: preserve-3d`。
- 验证：鼠标划过单卡倾斜；触摸模拟下无 transform。

### 4. 客户评价：从「setInterval 强制翻页」到「原生 snap 轨道」

- 证据：`before.html:387` — `setInterval(..., 3000)` + `track.style.transform`。
- 改动：`㉖ scroll-snap` 横滑；删除定时器与手写翻页；保留三张评价原文。
- 收益：惯性/回弹/边界由浏览器提供；用户可停在任意一张；不再抢控制权。
- 风险：低；需要给轨道 `tabindex="0"` 与可读区域名。
- 验证：390px 横滑吸附；键盘聚焦后方向键/触控板可滚动；无 `setInterval`。

### 5. FAQ + 基础可访问性：从「max-height 猜高度」到「原生 details + grid」

- 证据：`before.html:160` — `transition: max-height .4s`；`:21` `outline: none`；`:30` `backdrop-filter: blur(40px)`；`:243` `<img>` 无 alt；`:348/349` 输入无 label；`:58` `100vh`。
- 改动：
  - FAQ 改用 `<details>` + `grid-template-rows: 0fr→1fr`（`53`）。
  - 补 `prefers-reduced-motion`（库默认）。
  - 焦点改 `:focus-visible`。
  - 导航 blur 40 → 18px。
  - Hero 图加可读描述；输入包 `<label>`，字号 16px。
  - Hero 高度 `100dvh`；输入/弹窗用原生 `<dialog>`。
  - 删除自绘 modal、`touchmove` 劫持、非 passive scroll、`will-change: all`。
- 收益：键盘/读屏可用；移动端不因 blur 掉帧；展开高度不再猜像素。
- 风险：中；FAQ 结构变化需要保留原有三个问题与答案。
- 验证：Tab 可走完 FAQ/表单；Esc 关 dialog；系统 reduced-motion 下内容完整；390px 输入不缩放。

---

## preserve（不能动）

```yaml
copy: 全部原文案（标题、副标题、三段评价、三个 FAQ 答案、页脚）
brand: Northwind 名称、N 标记、原有 CTA 文案
info: 12,000+ 团队 / 98.6% 满意度 / 4.9 评分（原数据，不改）
entry: 导航「产品 / 客户 / 定价」、预约演示、免费试用、帮助中心
tracking: 真实项目里的 data-track / 埋点（demo 无）
```

## constraints

```yaml
stack: 纯 HTML（示例）；真实项目若 React/Vue，交付组件片段
mobile: 390px + iPhone Safari
deps: 只使用 library/motion-kit；不引 GSAP / 字体 CDN
scope: 只改交互与质感；不改信息结构、不新增区块
```

## 不在本轮

- 整页暗色主题（与品牌冲突，待确认）。
- 客户 logo 换成真实品牌（没有授权素材）。
- 把表单接到真实后端（demo 只做前端反馈）。

---

## 给 DEMO 的一句话

> 用 `templates/demo-shell` 作为骨架，保留 before 的全部文案与信息结构；
> 按上面 5 项实现 after，重点让用户并排感受：Hero 层级、CTA 反馈、卡片 hover、评价区自由滑动、FAQ 展开手感。
