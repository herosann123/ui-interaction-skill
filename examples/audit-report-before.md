> **示例报告**：输入是 `templates/demo-shell/before.html`（故意堆了常见反例）。
> 真实项目请把路径换成用户源码；每条仍需人工复核，静态扫描不等于结论。

# UI 交互体检报告

> 扫描 1 个文件，发现 36 项。P0 1 · P1 11 · P2 24。
>
> 启发式扫描，只提供 file:line 级证据；每条都需要人工或运行复核后才算结论。
> 无截图 / 无真实运行 → 不做视觉评分。

## 摘要

| 级别 | 数量 | 含义 |
| --- | --- | --- |
| P0 | 1 | 阻断交付：可访问性/永久不可见/明显错误 |
| P1 | 11 | 应优先修复：性能、手感、触摸兼容 |
| P2 | 24 | 优化项：现代替代、可维护性、细节 |

## P0

### [P0] 有动效但没有 prefers-reduced-motion 降级

- 规则：`a11y/reduced-motion` · 置信度：high
- 位置：`templates/demo-shell/before.html:33`
- 证据：`transition: all 0.3s linear; /* 问题：transition all + linear */`
- 为什么：前庭功能敏感的用户会因视差、缩放、抖动产生眩晕；这是交付硬约束，不是偏好。
- 建议：CSS 加 @media (prefers-reduced-motion: reduce) 静态版；JS 用 matchMedia 判断后直接落到 final state。
- 相关模式：① · ⑤ · ⑨ · ㉒ · ㊹

## P1

### [P1] 移除了焦点轮廓，但没有替代

- 规则：`a11y/outline-none` · 置信度：high
- 位置：`templates/demo-shell/before.html:21`
- 证据：`button, input { font-family: inherit; outline: none; }`
- 说明：检测到 outline: none，且项目中没有 :focus-visible 兜底。
- 为什么：outline: none 会让键盘用户失去当前位置；只补 :hover 不算替代。
- 建议：改用 :focus-visible 提供清晰可见的焦点环；不要全局移除 outline。

### [P1] 动画/过渡包含布局属性

- 规则：`perf/layout-animation` · 置信度：high
- 位置：`templates/demo-shell/before.html:160`
- 证据：`transition: max-height 0.4s linear; /* 问题：max-height hack */`
- 说明：transition 里出现了布局属性：max-height 0.4s linear
- 为什么：width / height / top / left / margin 每帧触发布局与绘制，低端机和大列表上会明显掉帧。
- 建议：用 transform: translate / scale 替代位移与缩放；高度展开用 grid-template-rows 0fr→1fr（模式 53）。
- 相关模式：① · ② · ⑦ · 53

### [P1] 动画/过渡包含布局属性

- 规则：`perf/layout-animation` · 置信度：high
- 位置：`templates/demo-shell/before.html:200`
- 证据：`.drag-fill { height: 100%; width: 38%; border-radius: 999px; background: #2563eb; transition: width 0.6s linear; }`
- 说明：transition 里出现了布局属性：width 0.6s linear
- 为什么：width / height / top / left / margin 每帧触发布局与绘制，低端机和大列表上会明显掉帧。
- 建议：用 transform: translate / scale 替代位移与缩放；高度展开用 grid-template-rows 0fr→1fr（模式 53）。
- 相关模式：① · ② · ⑦ · 53

### [P1] 可点击容器缺少键盘语义

- 规则：`a11y/clickable-div` · 置信度：high
- 位置：`templates/demo-shell/before.html:227`
- 证据：`<div class="nav-cta" onclick="openDemo()">预约演示</div>`
- 为什么：div / span 上的点击事件只服务鼠标；键盘用户无法聚焦或触发，读屏也不会播报为按钮。
- 建议：优先换成 <button> / <a>；保留容器时补 role="button"、tabindex="0" 与 Enter/Space 键盘处理。
- 相关模式：⑬ · ㉓ · 51

### [P1] <img> 缺少 alt

- 规则：`a11y/img-alt` · 置信度：high
- 位置：`templates/demo-shell/before.html:243`
- 证据：`<img class="chart" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='420' viewBox='0 0 720 420'%3E%3Crect width='720' height='420' rx='24' fi…`
- 为什么：没有 alt 的图片在读屏中会被读成文件名或直接跳过，信息与装饰都失去了语义。
- 建议：内容图写具体 alt；纯装饰图写 alt="" 或 aria-hidden="true"。

### [P1] 用 preventDefault 劫持 touchmove / wheel

- 规则：`mobile/touch-hijack` · 置信度：high
- 位置：`templates/demo-shell/before.html:401`
- 证据：`dragTrack.addEventListener('touchmove', function (e) {`
- 说明：touchmove + preventDefault
- 为什么：JS 手写滚动会丢掉原生惯性、回弹与无障碍滚动；还会与页面滚动打架。
- 建议：优先原生滚动 + scroll-snap（㉖/㉘）；确需接管时限定在局部容器，并保留按钮替代入口。
- 相关模式：㉖ · ㉘ · ㉚

### [P1] 表单控件没有可访问名称

- 规则：`a11y/input-label` · 置信度：medium
- 位置：`templates/demo-shell/before.html:225`
- 证据：`<input type="search" placeholder="搜索文档">`
- 为什么：placeholder 不是 label：聚焦后提示消失，读屏也不会把它当作字段名。
- 建议：用 <label for> 关联 id，或补 aria-label / aria-labelledby。

### [P1] 指针动效没有 hover/pointer 门控

- 规则：`motion/hover-pointer-gate` · 置信度：medium
- 位置：`templates/demo-shell/before.html:242`
- 证据：`<div class="hero-visual" onmousemove="tiltHero(event)" onmouseleave="resetHero()">`
- 为什么：磁吸、倾斜、自定义光标在触摸设备上坐标不稳定，必须用能力检测而不是屏幕宽度。
- 建议：用 matchMedia('(hover: hover) and (pointer: fine)') 门控；触摸端给按压/静态替代。
- 相关模式：④ · ⑨ · ⑱

### [P1] 表单控件没有可访问名称

- 规则：`a11y/input-label` · 置信度：medium
- 位置：`templates/demo-shell/before.html:348`
- 证据：`<input placeholder="工作邮箱">`
- 为什么：placeholder 不是 label：聚焦后提示消失，读屏也不会把它当作字段名。
- 建议：用 <label for> 关联 id，或补 aria-label / aria-labelledby。

### [P1] 表单控件没有可访问名称

- 规则：`a11y/input-label` · 置信度：medium
- 位置：`templates/demo-shell/before.html:349`
- 证据：`<input placeholder="公司名称">`
- 为什么：placeholder 不是 label：聚焦后提示消失，读屏也不会把它当作字段名。
- 建议：用 <label for> 关联 id，或补 aria-label / aria-labelledby。

### [P1] 滚动 / 手势监听未声明 passive

- 规则：`perf/non-passive-scroll` · 置信度：medium
- 位置：`templates/demo-shell/before.html:401`
- 证据：`dragTrack.addEventListener('touchmove', function (e) {`
- 说明：touchmove 监听没有 passive: true
- 为什么：非 passive 的 touchmove / wheel 会阻塞滚动；scroll 上的布局读取还会造成抖动。
- 建议：只读监听加 { passive: true }；需要 preventDefault 时明确说明原因，并用 rAF 节流。
- 相关模式：㉖ · ㉗ · ㉚

## P2

### [P2] backdrop-filter 模糊半径过大

- 规则：`perf/blur-heavy` · 置信度：high
- 位置：`templates/demo-shell/before.html:30`
- 证据：`backdrop-filter: blur(40px);`
- 说明：blur(40px) 偏重
- 为什么：大面积 backdrop-filter 会持续重绘；移动端超过 ~24px 很容易掉帧。
- 建议：降到 12–18px；移动端进一步降低或改半透明纯色；避免在滚动容器上叠 mix-blend-mode。
- 相关模式：⑩

### [P2] transition: all

- 规则：`perf/transition-all` · 置信度：high
- 位置：`templates/demo-shell/before.html:33`
- 证据：`transition: all 0.3s linear; /* 问题：transition all + linear */`
- 为什么：all 会让无关属性一起变化，容易把布局属性也拖进动画，且很难定位性能问题。
- 建议：只列真正要动的属性，例如 transform、opacity、background-color。
- 相关模式：⑦

### [P2] 表单字号小于 16px

- 规则：`mobile/input-font-zoom` · 置信度：high
- 位置：`templates/demo-shell/before.html:42`
- 证据：``
- 说明：.nav input → 14px
- 为什么：iOS Safari 聚焦小于 16px 的输入框会自动放大页面，打断填写。
- 建议：输入类控件 font-size 至少 16px；视觉字号可以用 transform 或内层元素控制。

### [P2] transition: all

- 规则：`perf/transition-all` · 置信度：high
- 位置：`templates/demo-shell/before.html:51`
- 证据：`transition: all 0.3s linear;`
- 为什么：all 会让无关属性一起变化，容易把布局属性也拖进动画，且很难定位性能问题。
- 建议：只列真正要动的属性，例如 transform、opacity、background-color。
- 相关模式：⑦

### [P2] 使用 100vh 而不是 100dvh

- 规则：`mobile/100vh` · 置信度：high
- 位置：`templates/demo-shell/before.html:58`
- 证据：`height: 100vh; /* 问题：100vh，移动端地址栏遮挡 */`
- 为什么：移动端地址栏伸缩时 100vh 会溢出，底部按钮被顶出视口。
- 建议：用 100dvh（保留 100vh 作 fallback），旋转/resize 后重新计算。

### [P2] transition: all

- 规则：`perf/transition-all` · 置信度：high
- 位置：`templates/demo-shell/before.html:74`
- 证据：`transition: all 0.3s linear;`
- 为什么：all 会让无关属性一起变化，容易把布局属性也拖进动画，且很难定位性能问题。
- 建议：只列真正要动的属性，例如 transform、opacity、background-color。
- 相关模式：⑦

### [P2] transition: all

- 规则：`perf/transition-all` · 置信度：high
- 位置：`templates/demo-shell/before.html:107`
- 证据：`background: #fff; transition: all 0.3s linear;`
- 为什么：all 会让无关属性一起变化，容易把布局属性也拖进动画，且很难定位性能问题。
- 建议：只列真正要动的属性，例如 transform、opacity、background-color。
- 相关模式：⑦

### [P2] 用 max-height 猜展开高度

- 规则：`modern/max-height-accordion` · 置信度：high
- 位置：`templates/demo-shell/before.html:160`
- 证据：`transition: max-height 0.4s linear; /* 问题：max-height hack */`
- 为什么：max-height 是猜测值：内容变化会截断，动画时长也会因内容长短不稳定。
- 建议：用 grid-template-rows: 0fr → 1fr（模式 53）或原生 <details>；新浏览器可用 interpolate-size。
- 相关模式：53 · 51

### [P2] 表单字号小于 16px

- 规则：`mobile/input-font-zoom` · 置信度：high
- 位置：`templates/demo-shell/before.html:184`
- 证据：``
- 说明：.modal-box input → 14px
- 为什么：iOS Safari 聚焦小于 16px 的输入框会自动放大页面，打断填写。
- 建议：输入类控件 font-size 至少 16px；视觉字号可以用 transform 或内层元素控制。

### [P2] target="_blank" 未加 rel

- 规则：`a11y/target-blank` · 置信度：high
- 位置：`templates/demo-shell/before.html:339`
- 证据：`<span><a href="#features">产品</a> · <a href="#faq">帮助</a> · <a href="https://example.com" target="_blank">帮助中心</a></span>`
- 为什么：新标签页可以通过 window.opener 反向控制原页面；也是常见的审计项。
- 建议：加 rel="noopener noreferrer"。

### [P2] will-change 使用过宽

- 规则：`perf/will-change` · 置信度：medium
- 位置：`templates/demo-shell/before.html:83`
- 证据：`will-change: all; /* 问题：will-change: all */`
- 说明：will-change: all
- 为什么：will-change 会长期占用合成层；all 或大面积使用反而增加内存与绘制成本。
- 建议：按需声明具体属性（transform / opacity），动画结束后移除，或只给少量关键元素。

### [P2] 滚动/指针处理里同步读布局

- 规则：`perf/rect-in-handler` · 置信度：medium
- 位置：`templates/demo-shell/before.html:357`
- 证据：`var r = el.getBoundingClientRect();`
- 为什么：在 scroll / mousemove 里调用 getBoundingClientRect 且没有 rAF 合帧，会强制同步布局。
- 建议：缓存 rect，resize 时重算；或用 rAF 把读取和写入分成两帧。
- 相关模式：① · ⑨ · ㉟

### [P2] 滚动 / 手势监听未声明 passive

- 规则：`perf/non-passive-scroll` · 置信度：medium
- 位置：`templates/demo-shell/before.html:374`
- 证据：`window.addEventListener('scroll', function () {`
- 说明：scroll 监听没有 passive: true
- 为什么：非 passive 的 touchmove / wheel 会阻塞滚动；scroll 上的布局读取还会造成抖动。
- 建议：只读监听加 { passive: true }；需要 preventDefault 时明确说明原因，并用 rAF 节流。
- 相关模式：㉖ · ㉗ · ㉚

### [P2] 手写 setInterval 轮播

- 规则：`modern/custom-carousel` · 置信度：medium
- 位置：`templates/demo-shell/before.html:387`
- 证据：`setInterval(function () {`
- 为什么：定时翻页会抢走用户控制，且手写 transform 轮播丢掉惯性、回弹和边缘行为。
- 建议：横向内容交给 scroll-snap（㉖/㉘），需要自动播放时提供暂停；指示点可用 56 兜底。
- 相关模式：㉖ · ㉘ · 56 · 14

### [P2] 主交互使用 linear 缓动

- 规则：`motion/linear-easing` · 置信度：low
- 位置：`templates/demo-shell/before.html:33`
- 证据：`transition: all 0.3s linear; /* 问题：transition all + linear */`
- 为什么：linear 在 UI 里常显得机械；真实物体有加速与减速。（spinner / 进度条除外）
- 建议：入场用 ease-out 系；弹簧用 cubic-bezier 或 linear() 采样；拖拽跟手阶段才用 linear。
- 相关模式：⑦ · 52

### [P2] 主交互使用 linear 缓动

- 规则：`motion/linear-easing` · 置信度：low
- 位置：`templates/demo-shell/before.html:51`
- 证据：`transition: all 0.3s linear;`
- 为什么：linear 在 UI 里常显得机械；真实物体有加速与减速。（spinner / 进度条除外）
- 建议：入场用 ease-out 系；弹簧用 cubic-bezier 或 linear() 采样；拖拽跟手阶段才用 linear。
- 相关模式：⑦ · 52

### [P2] 主交互使用 linear 缓动

- 规则：`motion/linear-easing` · 置信度：low
- 位置：`templates/demo-shell/before.html:74`
- 证据：`transition: all 0.3s linear;`
- 为什么：linear 在 UI 里常显得机械；真实物体有加速与减速。（spinner / 进度条除外）
- 建议：入场用 ease-out 系；弹簧用 cubic-bezier 或 linear() 采样；拖拽跟手阶段才用 linear。
- 相关模式：⑦ · 52

### [P2] 主交互使用 linear 缓动

- 规则：`motion/linear-easing` · 置信度：low
- 位置：`templates/demo-shell/before.html:107`
- 证据：`background: #fff; transition: all 0.3s linear;`
- 为什么：linear 在 UI 里常显得机械；真实物体有加速与减速。（spinner / 进度条除外）
- 建议：入场用 ease-out 系；弹簧用 cubic-bezier 或 linear() 采样；拖拽跟手阶段才用 linear。
- 相关模式：⑦ · 52

### [P2] 主交互使用 linear 缓动

- 规则：`motion/linear-easing` · 置信度：low
- 位置：`templates/demo-shell/before.html:129`
- 证据：`display: flex; transition: transform 0.5s linear;`
- 为什么：linear 在 UI 里常显得机械；真实物体有加速与减速。（spinner / 进度条除外）
- 建议：入场用 ease-out 系；弹簧用 cubic-bezier 或 linear() 采样；拖拽跟手阶段才用 linear。
- 相关模式：⑦ · 52

### [P2] 主交互使用 linear 缓动

- 规则：`motion/linear-easing` · 置信度：low
- 位置：`templates/demo-shell/before.html:147`
- 证据：`transition: transform 0.25s linear; /* 问题：列表行 hover transform */`
- 为什么：linear 在 UI 里常显得机械；真实物体有加速与减速。（spinner / 进度条除外）
- 建议：入场用 ease-out 系；弹簧用 cubic-bezier 或 linear() 采样；拖拽跟手阶段才用 linear。
- 相关模式：⑦ · 52

### [P2] 主交互使用 linear 缓动

- 规则：`motion/linear-easing` · 置信度：low
- 位置：`templates/demo-shell/before.html:160`
- 证据：`transition: max-height 0.4s linear; /* 问题：max-height hack */`
- 为什么：linear 在 UI 里常显得机械；真实物体有加速与减速。（spinner / 进度条除外）
- 建议：入场用 ease-out 系；弹簧用 cubic-bezier 或 linear() 采样；拖拽跟手阶段才用 linear。
- 相关模式：⑦ · 52

### [P2] 主交互使用 linear 缓动

- 规则：`motion/linear-easing` · 置信度：low
- 位置：`templates/demo-shell/before.html:200`
- 证据：`.drag-fill { height: 100%; width: 38%; border-radius: 999px; background: #2563eb; transition: width 0.6s linear; }`
- 为什么：linear 在 UI 里常显得机械；真实物体有加速与减速。（spinner / 进度条除外）
- 建议：入场用 ease-out 系；弹簧用 cubic-bezier 或 linear() 采样；拖拽跟手阶段才用 linear。
- 相关模式：⑦ · 52

### [P2] 自绘弹层缺少 dialog 语义

- 规则：`a11y/custom-dialog` · 置信度：low
- 位置：`templates/demo-shell/before.html:342`
- 证据：`<div class="modal" id="demoModal" onclick="if(event.target===this) closeDemo()">`
- 为什么：自绘 modal 往往漏掉焦点陷阱、Esc、背景滚动锁和 aria-modal；这些正是原生 <dialog> 免费的。
- 建议：迁移到 <dialog> + showModal()；保留自绘时补 role="dialog"、aria-modal、焦点管理、Esc 与滚动锁。
- 相关模式：51 · 50 · ⑩

### [P2] 用 setInterval 驱动视觉更新

- 规则：`perf/interval-animation` · 置信度：low
- 位置：`templates/demo-shell/before.html:387`
- 证据：`setInterval(function () {`
- 为什么：setInterval 与屏幕刷新不同步，容易抖动、堆积；后台标签页还会继续跑。
- 建议：改用 requestAnimationFrame（或 CSS 动画）；必须轮询时在 visibilitychange 时暂停。
- 相关模式：② · ③ · ⑰

---

下一步：按 `AUDIT.md` §4 / §6 选出 3–5 个「信息价值高、风险可控」的改动，再交给 `DEMO.md` 生成 Before/After。
