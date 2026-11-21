# Motion Kit · 内置交互库

> 零依赖、可单独使用、默认尊重 `prefers-reduced-motion`。
> 上面一层是 **本文件 + `motion-kit.css/js`**；完整的 56 种模式说明仍在 `../PATTERNS.md` 与 `../INDEX.md`。
> 机器可读清单：`manifest.json`（56 个模式 → demo / 模板 / kit 行为）。

---

## 1. 两层资产

| 层 | 内容 | 适合 |
| --- | --- | --- |
| **生产原语（本目录）** | 18 个 data-attribute / JS API 行为 + 一套基础组件样式 | 直接拷进项目；生成 demo；快速落地常用交互 |
| **完整模式库（上级目录）** | 56 种模式的原理、完整代码、调参、避坑、展示页 | 查资料、选型、实现长尾复杂模式 |

`manifest.json` 里每个模式都标了：`demo`（展示页）、`patterns`（技术手册章节）、`kit`（是否已封装为原语）、`fallback`（reduced-motion 降级）、`mobile`（触屏注意）。

---

## 2. 快速开始

```html
<link rel="stylesheet" href="motion-kit.css">

<!-- 尽早让 CSS 知道 JS 可用；2.5s 内库没起来就自动恢复可见 -->
<script>
  document.documentElement.classList.add('mk-js');
  setTimeout(function () {
    if (!window.MotionKit) document.documentElement.classList.remove('mk-js');
  }, 2500);
</script>

<!-- body 末尾 -->
<script src="motion-kit.js" defer></script>
```

最小示例：

```html
<h1 data-reveal-stagger="70">
  <span>把数据变成</span>
  <span>真正的决策</span>
</h1>

<button class="mk-btn mk-btn--primary"
        data-magnetic="0.3"
        data-ripple
        data-haptic="tap">
  开始使用
</button>

<b data-counter="12000" data-counter-suffix="+">0</b>
```

同一元素可以叠加多个行为；库内部用 `data-mk-bound="reveal tilt"` 记录，不会互相吞掉。

---

## 3. data-attribute 行为

### 3.1 入场与运动

| 属性 | 参数 | 对应模式 | 说明 |
| --- | --- | --- | --- |
| `data-reveal` | `up`（默认）/ `fade` / `left` / `right` / `scale` | ② | IntersectionObserver 入场；默认只播一次 |
| `data-reveal-delay` | `120`（ms） | ② | 单个元素延迟 |
| `data-reveal-duration` | `680`（ms） | ② | 单个元素时长 |
| `data-reveal-distance` | `28`（px） | ② | 位移距离 |
| `data-reveal-once` | `false` | ② | 滚出视口后重置，回看重新播放 |
| `data-reveal-stagger` | `80`（ms） | ⑤ | 给直接子元素自动加 `data-reveal` 与递增延迟 |
| `data-parallax` | `0.2`（速度系数） | ① | 必须放在 `[data-parallax-scope]` 或父元素内；只动 `transform` |
| `data-magnetic` | `0.3`（强度） | ④ | 仅 `(hover:hover) and (pointer:fine)` 启用 |
| `data-tilt` | `10`（最大角度） | ⑨ | 仅精细指针启用；自动写 `--mk-mx/--mk-my` 给径向高光 |
| `data-ripple` | — | ⑬ | 从 pointerdown 坐标扩散 |
| `data-ripple-color` | `rgba(...)` | ⑬ | 涟漪颜色 |

### 3.2 数据与文本

| 属性 | 参数 | 对应模式 | 说明 |
| --- | --- | --- | --- |
| `data-counter` | 目标数字，如 `1280` | ⑧ | 进入视口后滚动到目标 |
| `data-counter-from` | `0` | ⑧ | 起始值 |
| `data-counter-duration` | `1200`（ms） | ⑧ | 时长 |
| `data-counter-decimals` | `1` | ⑧ | 小数位 |
| `data-counter-prefix` | `¥` | ⑧ | 前缀 |
| `data-counter-suffix` | `+` / `%` | ⑧ | 后缀 |
| `data-counter-locale` | `zh-CN` | ⑧ | 千分位规则 |
| `data-stream` | — | ⑰ | 流式打字容器 |
| `data-stream-text` | 完整文本 | ⑰ | 必填；不会用 `innerHTML` |
| `data-stream-speed` | `28`（ms/字符） | ⑰ | 标点 ×3、换行 ×4 |
| `data-stream-on` | `view`（默认）/ `load` | ⑰ | 进入视口或立即开始 |
| `data-stream-loop` | — | ⑰ | 完成后 1.8s 重播 |

### 3.3 弹层与导航

| 属性 | 参数 | 对应模式 | 说明 |
| --- | --- | --- | --- |
| `data-modal` | — | ⑩ / 50 | 放在 `<dialog class="mk-dialog">` 上 |
| `data-modal-open="id"` | — | — | 打开对应 dialog |
| `data-modal-close` | — | — | 关闭最近的 dialog |
| `data-sheet` | — | ㉚ | 放在 `<dialog class="mk-sheet">` 上 |
| `data-snap="0.55,0.92"` | 视口比例 | ㉚ | 抽屉吸附点；最后一个为全开 |
| `data-sheet-handle` | — | ㉚ | 拖拽把手；只有这里禁 `touch-action` |
| `data-sheet-open="id"` / `data-sheet-close` | — | ㉚ | 开关抽屉 |
| `data-tabs` | — | ㉘ | 容器；内部需 `[role="tablist"]`、`[role="tab"]`、`[data-tabs-viewport]`、`[role="tabpanel"]` |
| `data-swipe-row` | — | ㉛ | 行容器；内部 `.mk-swipe__content` + `.mk-swipe__actions` |
| `data-swipe-toggle` | — | ㉛ | 行内可见「更多」按钮，键盘可达 |
| `data-cmdk` | — | ㉓ | 放在 `<dialog class="mk-cmdk">` 上；⌘/Ctrl+K 打开 |
| `data-cmdk-open` | — | ㉓ | 可见的搜索按钮也能打开命令栏 |
| `data-cmdk-input` / `data-cmdk-item` / `data-cmdk-empty` | — | ㉓ | 输入框、条目、空状态 |
| `data-haptic` | `tap` / `snap` / `success` / `warn` | ㉜ | 状态变化瞬间的触感；无 vibrate 静默降级 |
| `data-toast` | 消息文本 | ⑤ / ㉜ | 点击显示统一 toast；`data-toast-close` 关闭所在 dialog；`href="#"` 会阻止跳转 |

---

## 4. JS API

```js
// 数值动画：reduced-motion 时直接到终值
MotionKit.animateValue({
  from: 0,
  to: 100,
  duration: 800,
  onUpdate(value) { console.log(value); },
  onDone() {}
});

// 流式文本：返回 Promise；重复调用会自动取消上一次
await MotionKit.stream(el, '完整文本', { speed: 24, caret: true });

// 触感
MotionKit.haptic('success'); // tap | snap | success | warn

// 统一 toast
MotionKit.toast('已保存', { duration: 2000 });

// 角标：delta >= 2 时额外飞出「+N」
MotionKit.bump(badgeEl, 3);

// FLIP：先 capture，切换 DOM 后调用 flip
const first = MotionKit.capture(cardEl);
openDetail();
MotionKit.flip(first, detailEl, { duration: 420 });

// 动态创建的内容（如新加的卡片）
MotionKit.init(newSection);

// 清理（SPA 卸载页面时）
MotionKit.destroy();
```

只读属性：`MotionKit.reduced`、`MotionKit.finePointer`、`MotionKit.version`。

---

## 5. CSS 组件

| 类名 | 用途 |
| --- | --- |
| `.mk-btn` / `--primary` / `--ghost` / `--glass` | 44px 最小点击区、按压 0.96、focus-visible |
| `.mk-glass` | 玻璃拟态（blur 18px，可覆盖 `--mk-glass-blur`） |
| `.mk-card` | 基础卡片 |
| `.mk-ripple` | JS 自动插入的涟漪；无需手写 |
| `.mk-tilt-glow` | 放在 `[data-tilt]` 内，径向高光 |
| `.mk-badge` | 角标；配合 `MotionKit.bump` |
| `.mk-skeleton` | 骨架屏扫光；reduced 时停止 |
| `.mk-switch` + `__track` + `__thumb` | 玻璃开关（原生 checkbox） |
| `.mk-tabs` + `__bar/__tab/__indicator/__viewport/__panel` | Tab 结构 |
| `.mk-snap` | 原生横滑轨道；子项自动 `scroll-snap-align` |
| `.mk-swipe` + `__content/__actions` | 列表滑动操作 |
| `.mk-sheet` + `__handle/__body` | 底部抽屉 |
| `.mk-dialog` / `.mk-cmdk` | 原生 dialog / 命令栏 |
| `.sr-only` | 视觉隐藏但可被读屏读取 |
| `.mk-caret` | 流式光标 |
| `.mk-toast` | 统一 toast；`--mk-toast-bottom` 控制底部距离 |

主题变量：`--mk-accent`、`--mk-surface`、`--mk-ink`、`--mk-border`、`--mk-radius`、`--mk-ease-out`、`--mk-ease-spring` 等。组件会读取这些变量，不绑定品牌。

---

## 6. 可访问性与降级

- 所有动效在 `prefers-reduced-motion: reduce` 下瞬时/静态；CSS 与 JS 都判断。
- 入场元素只在 `html.mk-js` 存在时隐藏；库未加载时内容保持可见。
- 弹层用原生 `<dialog>`，焦点、Esc、背景滚动锁由浏览器负责。
- 抽屉只有把手禁 `touch-action`；内容区保留 `pan-y`。
- 滑动行保留可见的 `data-swipe-toggle`，不把删除/置顶做成唯一手势入口。
- 触感仅在状态变化时触发；iOS Safari 没有 `vibrate` 时静默跳过。
- 命令栏支持 ↑↓ / Enter / Esc，输入框字号 16px。

---

## 7. 浏览器支持

| 能力 | 基线 | 降级 |
| --- | --- | --- |
| `dialog` + `showModal` | Chrome 37+ / Safari 15.4+ | 库内 fallback 到 `open` 属性 |
| `backdrop-filter` | 现代浏览器 | 纯半透明背景 |
| `@starting-style` / `allow-discrete` | Chrome 117+ / Safari 17.4+ | 直接显隐（无进出场动画） |
| View Transitions | Chrome 111+ / Safari 18+ | 直接切换 class |
| `navigator.vibrate` | Android Chrome | 静默 |
| `scroll-snap` | 现代浏览器 | 普通滚动 |

---

## 8. 拷进真实项目

1. 复制 `motion-kit.css` / `motion-kit.js` 到项目的 static / assets 目录。
2. 在全局样式之前或之后引入 CSS（建议之后，便于覆盖变量）。
3. 在 body 末尾引入 JS；如果内容在首屏，保留 `mk-js` 的早启脚本。
4. 用项目令牌覆盖 `--mk-*`，不要直接改组件内部颜色。
5. 如果项目已有自己的按钮 / 卡片体系，只取需要的类，不要整套引入。

React / Vue 里推荐把 data-attribute 当成声明式契约：

```jsx
useEffect(() => {
  MotionKit.init(ref.current);
  return () => MotionKit.destroy();
}, []);

<button ref={ref} className="mk-btn mk-btn--primary"
        data-magnetic="0.3" data-ripple data-haptic="tap">
  开始
</button>
```

注意：`MotionKit.init(root)` 只扫描 `root` 及其后代；动态挂载的节点要再调用一次，或把容器交给它。

---

## 9. 扩展一个新行为

1. 在 `motion-kit.js` 里加 `initXxx(ctx)`，用 `qsa('[data-xxx]', ctx)` + `claim(el, 'xxx')`。
2. 用 `add(el, type, fn, opts)` 注册监听，`destroy()` 会自动清理。
3. 在 `init()` 里按顺序调用；在 `motion-kit.css` 里加样式与 reduced-motion 分支。
4. 在 `manifest.json` 的 `kit.behaviors` 和本 README 表格里补一行。
5. 用 `templates/` 里至少一个模板验证，并跑 `node --check library/motion-kit.js`。

---

## 10. 与 56 种模式的关系

- `manifest.json` 是完整索引：每个模式都有 `kit` 字段。
- 标了 `data-*` / `MotionKit.*` 的模式可以直接用库；
- 标 `—` 的模式仍需参考 `../PATTERNS.md` 的完整实现（例如粒子网络、Folding Drawer、按住说话、惯性甩动）。
- 长尾模式优先组合现有原语，而不是往库里塞更多默认开启的行为。
