---
name: ui-interaction-skill
description: 选择并实现高级 UI 交互模式（56 种），内置零依赖 motion-kit、9 套页面模板与排版/色彩/布局的 Design Core（4 套气质 / type scale / spacing / 组件 8 态）。支持代码体检、生成 Before/After 可运行改版 demo、按反馈版本化迭代；也用于「高级感 / premium / motion」升级。
type: design-pattern
version: 3.4.0
user-invocable: true
argument-hint: "[audit <path> | demo <template> | iterate <feedback> | <module> <pattern-id>]"
license: MIT
trigger:
  - 正在设计 UI 动效 / 交互动画 / 视觉运动
  - 用户反馈「太通用」「没质感」「要 App Store 那种高级感」
  - 实现落地页 / 作品集 / 引导页 / 营销页 / 产品页 / AI 产品
  - 提到「动效」「交互」「高级感」「premium」「polished」「motion」
  - 需要为特定 UI 模块选择合适的交互模式（Hero、卡片、按钮、计数器、加载、弹窗、Onboarding 等）
  - 用户要求「检查 / 体检 / 看看我的前端代码哪里能优化、替代」
  - 用户要求「按这些要求做一个改版 demo / Before After / 可运行的原型」
  - 用户对已生成的 demo 提修改反馈，需要版本化迭代
when_not_to_use:
  - 纯后台且明确不要动效时：只做可访问性 / 性能体检，不上视觉动效
  - 性能受限场景（低端机 / 嵌入式）：只做体检与静态降级，不默认上重动效
  - 用户明确要求「静态 / 极简 / 无动画」：只做布局 / 可访问性，不主动加动效
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# UI 交互 Skill · 高级模式选择与实现

> 25 种核心交互模式 + 15 种移动端手感/高级手感模式 + 8 种移动端组件与情绪模式 + 8 种前沿 CSS 原生动效 + 模块级映射表 + 决策树。
> 配套 demo：`./10-ui-interactions.html`（①-⑩）+ `./advanced-ui-v2.html`（⑪-⑰）+ `./advanced-ui-v3.html`（⑱-㉕）+ `./mobile-ui.html`（㉖-㉜ 手机端试玩）+ `./mobile-ui-pro.html`（㉝-㊵ 高级手感试玩）+ `./mobile-ui-plus.html`（㊶-㊽ 组件与情绪试玩）+ `./frontier-css.html`（49-56 前沿 CSS 原生，渐进增强）
> 配套技术手册：`./PATTERNS.md`（每种模式的完整代码模板 + 调参指南）
> **v3 新增**：`library/motion-kit.css/js`（零依赖交互库）+ `library/manifest.json`（56 模式索引）+ `templates/`（9 套页面）+ `scripts/audit.mjs`（体检）+ `scripts/new-demo.mjs`（改版脚手架）+ `scripts/design-lint.mjs`（设计层检查）+ `scripts/check.mjs`（自检）+ `AUDIT.md` / `DEMO.md` / `ITERATE.md`（审查 → demo → 迭代协议）+ `references/`（映射与反模式全文）+ `DESIGN.md` / `design-core/`（排版 / 色彩 / 布局 / 8 态）+ `DIRECTION.md` / `directions/`（9 套方向）+ `BRAND.md` / `CRITIQUE.md`

---

## 0. 工作模式与资产地图

先判断用户在哪一步。不要默认从头推荐模式。

| 模式 | 触发 | 做什么 | 产物 | 详细协议 |
| --- | --- | --- | --- | --- |
| **A 选型 / 解释** | 「Hero 用什么动效」「解释 ㉑」「按钮 磁吸」 | 查 §4 / §5 / §6，按 §11.1 四层输出 | 推荐 + 代码位置 | 本文 |
| **A0 设计定调** | 「不够高级 / 字怎么排 / 配色 / 布局乱」 | 先过三方向门（新视觉任务）→ brand → design.json | 3 个方向 + `design.json` | `DIRECTION.md` / `BRAND.md` / `DESIGN.md` |
| **B 代码体检 AUDIT** | 「看看我的前端哪里能优化 / 替代」 | 扫描 + 人工复核 + 分级 | 体检报告 + 3–5 条改动清单 | `AUDIT.md` |
| **C 生成改版 Demo DEMO** | 「按这些要求做个 demo / Before After」 | 选 3–5 项 → 脚手架 → 换内容 → 验证 | `ui-runs/<slug>/` 可运行对照 | `DEMO.md` |
| **D 反馈迭代 ITERATE** | 「这里再轻一点 / 不要这个 / 换成 X」 | CR 拆分 → 版本化 → 最小 diff → 验收 | vN + CHANGELOG | `ITERATE.md` |

**默认路由**：

1. 只有模块 / 模式问题 → A。
2. 给了代码 / 路径，并要求「看哪里能改」→ B。
3. 已有体检结论或明确改动，要求「做出来看看」→ C。
4. 已有 demo，提修改 → D。
5. 一句话里既有审查又有生成 → **先 B 出 3–5 项，确认范围后再 C**；不要直接生成整页重做。

**用户可能的输入**：

- `/ui-interaction-skill hero` → 给 Hero 推荐方案
- `/ui-interaction-skill 按钮 磁吸` → 为按钮找磁吸实现
- `/ui-interaction-skill audit ./src` → 前端交互体检
- `/ui-interaction-skill demo hero` → 用 Hero 模板生成改版目录
- `/ui-interaction-skill iterate 按钮再轻一点` → 在当前 demo 上迭代

### 0.1 资产地图

| 资产 | 用途 |
| --- | --- |
| `DESIGN.md` + `design-core/` | 排版 / 色彩 / 布局 / 组件状态：4 套 archetype、type scale、spacing、design.json |
| `DIRECTION.md` + `directions/` | 三方向门 + 9 套真实方向样张；先出 3 个方向再实现 |
| `BRAND.md` + `brand/` | 品牌资产协议：真实 logo / 产品图 / UI 截图 / 来源核验 |
| `CRITIQUE.md` | 6 维视觉评审 + 证据 / 四态 / Keep-Fix-Quick Wins |
| `library/motion-kit.css` / `.js` | 零依赖交互库：reveal / parallax / magnetic / tilt / ripple / counter / stream / dialog / sheet / tabs / swipe-row / cmdk / haptic / toast / bump / flip |
| `library/manifest.json` | 56 个模式 → demo / PATTERNS 章节 / kit 行为 / 移动端注意 / reduced 降级，机器可读 |
| `components/` | 5 组可复制组件：buttons / feedback / forms / navigation / data |
| `presets/` | 4 套主题令牌：editorial / glass / soft（预览 `presets/index.html`） |
| `library/adapters/` + `motion-kit.esm.js` + `.d.ts` | SSR 安全、React hook / Vue directive、TypeScript 类型 |
| `templates/` | 9 套可运行页面：demo-shell、hero、feature-grid、ai-chat、mobile-feed、mobile-detail、dashboard、checkout、settings |
| `scripts/audit.mjs` | 静态体检器（P0/P1/P2 + file:line + 推荐模式 + SARIF / baseline） |
| `scripts/brief.mjs` / `iterate.mjs` | 体检 JSON → demo brief；run 版本快照 + CHANGELOG |
| `scripts/smoke.mjs` / `screenshot.mjs` / `sanitize.mjs` | 390px + reduced-motion 烟测；页面截图；演示页脱敏 |
| `scripts/new-demo.mjs` | 生成 Before/After/Split run 目录 |
| `scripts/bundle-demo.mjs` | 把 motion-kit 内联成单文件 |
| `AUDIT.md` / `DEMO.md` / `ITERATE.md` | 三个工作流的完整协议 |
| `references/mapping.md` / `anti-patterns.md` | 模块映射、组合配方、反模式、性能预算全文 |
| `PATTERNS.md` / `INDEX.md` / 各 demo | 长尾模式的完整代码与展示 |

### 0.2 四条铁律

1. **先证据后结论**：没有 `file:line` / 截图 / 运行结果，不下判断、不打分。
2. **一次只做 3–5 项**：改版 demo 是决策工具，不是作品集。
3. **Before / After 同内容**：只改交互、层级与质感；不新增营销数据、不删功能。
4. **reduced-motion 是交付门槛**：不是可选项；每个新增动效都要有静态版。

---

## 1. 触发条件

**应该使用本 skill 的场景：**

- 设计新页面的动效时
- 现有页面"感觉太通用"，需要升级到 premium 质感
- 实现具体模块（Hero / 卡片 / 按钮 / Loading / Modal 等）的交互
- 客户/产品要求"高级感"、"App Store 风格"、"有质感"
- 需要审查现有前端代码，找可优化 / 可替代的交互点
- 需要把审查结论做成可运行的 Before/After 改版 demo，并按反馈迭代

**不应该使用的场景：**

- 数据密集型后台工具（动效反而干扰效率）
- 低端机 / 嵌入式 / 强性能约束
- 用户明确要"极简"、"静态"

---

## 2. 核心决策框架：输入 × 策略 二维矩阵

所有交互都可以从「**输入是什么**」和「**变换什么属性**」两个维度分类：

```
              Position   Scale    Filter   Path    Physics
              位移       缩放     视觉     路径    物理
              ──────────────────────────────────────────────
Scroll   滚动     ① 视差     ② 触发动画
Gesture  手势     ③ 堆叠 ④ 磁吸                      ⑦ 弹性
Time     时间轴   ⑤ 文字揭示                    ⑥ SVG ⑧ 数字
Pointer  光标     ⑨ 3D 倾斜                  ⑩ 玻璃
```

**口诀**：先想「输入从哪儿来」，再想「要变换什么」。两者交叉就是答案。

---

## 3. 决策流程图

```
任务：要为 [MODULE] 设计交互
  │
  ├─ 模块：Hero 主视觉 / 产品页
  │    └─ 推荐：① 视差（背景层） + ⑤ 文字揭示（标题）
  │
  ├─ 模块：可滑动卡片（Feed/发现/匹配）
  │    └─ 推荐：③ 卡片堆叠
  │
  ├─ 模块：按钮（CTA / Submit / 主要操作）
  │    ├─ 桌面端 → ④ 磁吸按钮
  │    └─ 移动端 → 跳过磁吸，用 ⑦ 弹性反馈
  │
  ├─ 模块：数据/数字展示（统计/计数器/计数器）
  │    └─ 推荐：⑧ 数字翻牌
  │
  ├─ 模块：Logo / 图标 / 品牌标识
  │    └─ 推荐：⑥ SVG 路径绘制
  │
  ├─ 模块：Modal / 弹窗 / 抽屉 / 浮层
  │    └─ 推荐：⑩ 玻璃拟态（背景） + ⑤ 文字揭示（内容）
  │
  ├─ 模块：设置开关 / 主题切换 / 状态卡
  │    └─ 推荐：⑩ 玻璃拟态
  │
  ├─ 模块：Loading / 加载占位
  │    └─ 推荐：⑥ SVG 路径（品牌元素） 或 ⑦ 弹性（圆形指示器）
  │
  ├─ 模块：Onboarding / 引导页
  │    └─ 推荐：⑤ 文字揭示（顺序讲故事） + ② 滚动触发
  │
  ├─ 模块：详情/特性展示卡（hover 才有戏）
  │    └─ 推荐：⑨ 3D 倾斜 + 径向高光
  │
  ├─ 模块：横向卡片轨道 / 全屏引导页（手机）
  │    └─ 推荐：㉖ 原生手感滚动（scroll-snap）
  │
  ├─ 模块：二级页返回（手机 WebApp）
  │    └─ 推荐：㉗ 滑动返回 + ㉙ push/pop 过渡
  │
  ├─ 模块：顶部 Tab（手机）
  │    └─ 推荐：㉘ Tab 滑动切换（内容 snap 轨道 + 跟手指示器）
  │
  ├─ 模块：列表 → 详情（手机 WebApp 路由）
  │    └─ 推荐：㉙ 推入/推出（下钻右进、返回右出）
  │
  ├─ 模块：地图 POI 卡 / 筛选面板 / 分享面板（手机）
  │    └─ 推荐：㉚ Bottom Sheet（snap 点 + 拖拽收起）
  │
  ├─ 模块：消息/待办列表行操作（手机）
  │    └─ 推荐：㉛ 滑动显露按钮 + ㉜ 触感
  │
  └─ 模块：内容长文阅读页
       └─ 跳过所有！保留 ② 滚动触发（淡入即可）
```

---

## 4. ★ 模块 → 模式 映射表（核心）

> 完整表在 `references/mapping.md` §4；这里只留高频入口。查表后按 §11.1 四层输出。

| UI 模块 | 首选 | 备选 / 注意 |
|---|---|---|
| Hero 主视觉 | ① 视差 + ⑤ 揭示 | ⑨ 特性卡；视差 ≤3 层 |
| 主 CTA | ④ 磁吸（桌面）/ ⑦ 按压（移动） | 移动端禁用磁吸 |
| 特性卡 / 定价卡 | ⑨ 3D 倾斜 | 触摸端静态 |
| 数字 / 统计 | ⑧ 计数 | ㉒ 滚动驱动数字 |
| 卡片 → 详情 | ⑮ FLIP / ⑯ View Transitions | 共享元素要有稳定 id |
| Loading / 空状态 | ⑥ SVG / ㊻ 骨架 / ㉔ Blob | <800ms 不显示 loading |
| 弹层 / 抽屉 | ⑩ + 51 dialog / ㉚ sheet | 原生优先 |
| AI 对话 | ⑰ 流式打字机 | 必须有光标 |
| 手机横滑区 | ㉖ snap | 不要 JS 劫持滚动 |
| 手机路由 | ㉙ push/pop + ㉗ 滑动返回 | 双层同动 |
| 手机列表行操作 | ㉛ + ㉜ 触感 | 保留可见按钮 |
| 手机底部面板 | ㉚ Bottom Sheet | 只在 handle 禁 touch-action |
| 新项目 reveal | 49 CSS 滚动驱动 | 旧浏览器 @supports |

- 移动端手感总表：`references/mapping.md` §3.6–3.8
- 前沿 CSS 原生：`references/mapping.md` §3.9
- 56 模式一行速查：`INDEX.md`
- 组合配方：`references/mapping.md` §6（一屏 ≤2 主 + 1 次）

---

## 5. 模式速查表（详见 PATTERNS.md）

> 56 种模式的一行原理 / 关键参数 / 复杂度，按分组整理在 `INDEX.md`；完整代码见 `PATTERNS.md`。

| 分组 | demo |
|---|---|
| 基础 ①–⑩ | `10-ui-interactions.html` |
| 进阶 ⑪–⑰ | `advanced-ui-v2.html` |
| 前沿 ⑱–㉕ | `advanced-ui-v3.html` |
| 手机手感 ㉖–㉜ | `mobile-ui.html` |
| 高级手机手感 ㉝–㊵ | `mobile-ui-pro.html` |
| 组件与情绪 ㊶–㊽ | `mobile-ui-plus.html` |
| 前沿 CSS 49–56 | `frontier-css.html` |

---

## 6. 组合配方（关键）

**一屏最多 2 个主模式 + 1 个次要模式**，否则视觉混乱。

| 配方 | 组合 | 场景 |
|---|---|---|
| Premium Hero | ① + ⑤ + ④ | 落地页首屏 |
| App Store Card | ⑨ + ⑧ + ⑤ | 推荐位 |
| Native App Feel | ㉙ + ㉗ + ㉜ | 手机 WebApp |
| Mobile Feed Premium | ㉖ + ㉛ + ㉜ | 首页信息流 |
| Social Feed | ㊶ + ㊼ + ㊻ | 社区 / 图片流 |
| Data Story | ㉒ + ⑭ + ⑳ | 数据长页 |
| Modern Native Stack | 51 + 50 + 54 | 零 JS 弹层 |

完整 30+ 配方（含桌面 / 手机 / AI / 品牌页）：`references/mapping.md` §6。

---

## 7. 反模式（必须避免）

> 完整 60+ 条按「错配模块 / 错配缓动 / 错配叠加」分类在 `references/anti-patterns.md` §7。最常踩的：

- 长文阅读页用视差 / 列表行 hover 位移 → 干扰阅读与扫描
- 移动端小按钮用磁吸；触摸拖拽没有 `touch-action` + `pointercancel`
- 关键 CTA 用文字揭示；手势做唯一入口（无可见按钮）
- 动画 width / height / top / left；`transition: all`；主交互 `linear`
- 同屏 >4 个动效源；极光 + 粒子 + 玻璃堆在同一层
- 用 setInterval 手写轮播 / 翻页；JS 劫持 touchmove
- 自绘 modal 不做焦点管理；删除 reduced-motion

---

## 8. 性能与无障碍预算

**性能预算**

| 设备 | 同时动效 | 持续时长 | 避免 |
|---|---|---|---|
| 高端桌面 | ≤4 | 无限制 | — |
| 中端手机 | ≤2 | ≤600ms | blur >20px、3D 倾斜 |
| 低端机 / 小程序 | ≤1 | ≤400ms | 复杂 SVG、blur >12px |
| iOS Safari | ≤3 | ≤800ms | 过深 backdrop-filter |

**铁律**：只动 `transform` / `opacity`；不动画 layout 属性；长列表 `will-change` 用完移除；持续动画离屏暂停。

**无障碍**：每个动效必须有 `prefers-reduced-motion` 静态版；关键状态用「颜色 + 形状 + 文本」三重提示。逐模式 fallback 表在 `references/anti-patterns.md` §8。

```javascript
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
if (reduce.matches) {
  // 直接落到 final state，不播放动画
}
```

---

## 9. 技术栈参考

| 场景 | 推荐栈 |
|------|--------|
| **Web 落地页** | GSAP + ScrollTrigger + Draggable（CDN 即可） |
| **React 项目** | Framer Motion（spring 内建） + react-spring |
| **Vue 项目** | @vueuse/motion + GSAP |
| **微信小程序** | WXS + wx.createAnimation（轻量）或 Lottie |
| **iOS App** | UIKit Dynamics（spring）+ Core Animation |
| **Android App** | SpringAnimation + MotionLayout |
| **跨端框架** | Lottie（动画导出）+ Reanimated 3 |

**GSAP 是最稳的选择**，10 种模式全部支持，社区文档完备，免费版已够用。

---

## 10. 使用流程（agent 操作步骤）

### A · 选型 / 解释

1. **识别模块**：用户在为哪个 UI 模块设计交互？
2. **查表 §4**：找到该模块对应的推荐模式。
3. **看组合 §6**：确认要叠加哪些次要模式（≤ 2 个）。
4. **避坑 §7 + 预算 §8**：检查反模式与目标平台性能。
5. **查代码**：`PATTERNS.md` 找对应实现；常用行为优先用 `library/`。
6. **输出**：按 §11.1 四层分级；验收走 §11.4。

### B · 代码体检（完整协议见 `AUDIT.md`）

1. **拿输入**：代码路径 / 技术栈 / 目标设备 / 必须保留项。
2. **跑扫描**：`node scripts/audit.mjs <path> --out ui-runs/<slug>/audit.md`。
3. **人工复核**：逐条确认 / 误报 / 待运行验证。
4. **分级**：P0 → P1 → P2；过 §11.2 减法表与 `AUDIT.md` §4 替换决策。
5. **输出**：报告 + 3–5 条改动清单 + demo brief。

### C · 生成改版 Demo（完整协议见 `DEMO.md`）

1. **范围**：从体检里选 3–5 项；P0 优先，主路径优先。
2. **脚手架**：`node scripts/new-demo.mjs --name ... --template ... [--before ...]`。
3. **换内容**：真实文案 / 品牌 / 素材；Before 与 After 信息结构一致。
4. **实现**：优先 `library/motion-kit`；每个动效补 reduced-motion。
5. **验证**：控制台、390px、键盘、reduced-motion；四态结论。

### D · 反馈迭代（完整协议见 `ITERATE.md`）

1. **拆 CR**：target / current / desired / constraints / acceptance。
2. **分诊**：参数、感觉词、新增模式、冲突、范围蔓延分别处理。
3. **版本化**：改前 `cp after.html versions/after-vN.html`。
4. **最小 diff**：只改目标；更新改动说明与 CHANGELOG。
5. **验收**：四态；未验证不写「已适配」。

---

## 11. 输出、评审与验收协议

> v2.1 新增。协议方法借鉴 `uiux-design-suite` 并按本 skill 的模式推荐/评审场景适配；
> 对抗性测试场景见 `evals/scenarios.md`。

### 11.1 输出分级契约（四层）

任何「该用什么模式」的回答按以下四层组织，不输出无主次的平铺清单：

| 层级 | 含义 | 例子 |
|------|------|------|
| **必须满足** | 违反即返工的硬约束 + 验收方式 | 移动端禁用磁吸；必须有 reduced-motion fallback |
| **推荐方案** | 一条可行路线；执行者有证据时可换等效方案 | 主 CTA：桌面 ④ 磁吸 / 移动 ⑦ 弹性按压 |
| **可选实验** | 预算允许才试，失败可撤销 | 第二屏尝试 ⑲ 水平叙事 |
| **禁止或避免** | 保护任务与性能的边界；不给无依据的永久审美禁令 | 长文页不加视差；同屏动效源 ≤ 4 |

### 11.2 减法决策（先删后加）

用户想「再加一个动效」时，**先过减法表，再决定是否新增**：

| 检查项 | 问题 | 处理 |
|--------|------|------|
| 信息价值 | 该元素在信息 / 操作 / 反馈 / 识别上有作用吗？ | 无作用 → 删，不降级保留 |
| 重复说明 | 同一信息是否已被视觉表达？ | 文字 + 动效 + 颜色三重冗余 → 留其一 |
| 任意强调 | 高亮 / 动效指向核心任务，还是随机装饰？ | 随机强调 → 删 |
| 过量效果 | 同屏动效源 > 4 个？ | 删到 ≤ 2 主 + 1 次 |
| 定制组件 | 原生 / 已有组件是否已够用？ | 够用 → 用原生 |

每条删除建议必须回答两个问题：**原有作用是什么、必要信息如何保留**。
不把极简当统一答案——不删关键操作反馈、错误提示、可访问名称、真实业务信息。

### 11.3 评审协议（盲评输入包）

被要求「评价 / 打分我的页面」时：

- **允许输入**：真实截图（标注视口 / 页面状态 / 版本）+ 可选质量参考图 + 一句固定的产品用途说明
- **禁止输入**：源码实现细节、作者设计理由、历轮评价与分数、期望分数
- **无截图 → 不做视觉评价**：只能给代码级 / 规格级意见，不得编造画面或分数
- 评审结论区分「看到了什么」与「推断意图是什么」，低信心判断明确标注
- 同一上下文无法隔离时标注「非独立评审」；换口吻 ≠ 盲评
- 静态截图推不出：点击行为、键盘焦点、性能数值、真实用户成功率 → 移交验收环节

### 11.4 验收四态结论

任何「做好了没有」的验收，逐项给出四态，不用二元通过 / 失败：

| 状态 | 含义 | 触发条件 |
|------|------|---------|
| ✅ 通过 | 亲自验证过证据 | 真实截图 / 行为测试 / 浏览器操作 |
| ❌ 未通过 | 有反证 | 移动端拖拽被 pointercancel 掐断 |
| ⚠️ 未验证 | 没证据，既不能过也不能算失败 | 实现者自称已修复但无新截图 |
| ➖ 不适用 | 本项不在范围，必须说明理由 | 桌面专用模式不测触屏 |

**铁律**：实现者自测只是「待核验声明」；关键项未验证时不得整体放行；高审美分不能抵消未验证项。

### 11.5 代码体检（AUDIT）

- **输入**：源码路径 / 技术栈 / 目标设备 / 不能动的内容。
- **扫描**：`node scripts/audit.mjs <path> --out ui-runs/<slug>/audit.md`；可加 `--json`。
- **复核**：每条标「确认 / 误报 / 待运行验证」；静态扫描只是证据，不是裁决。
- **输出**：P0/P1/P2 + `file:line` + 四层分级 + 3–5 条 demo 范围。
- **不做**：无截图不评视觉、不编分数、不把「重做」当默认。
- 完整规则库、替换决策、报告模板：`AUDIT.md`。

### 11.6 改版 Demo（DEMO）

- **范围**：3–5 项；P0 优先，主路径优先，一个「啊哈」时刻，一个克制收尾。
- **脚手架**：`node scripts/new-demo.mjs --name <slug> --title "<标题>" [--template <name>] [--before <file>]`。
- **内容**：Before / After 同一份文案与信息结构；只改交互、层级与质感。
- **实现**：优先 `library/motion-kit`；无 reduced-motion 不交付；触摸端不用 hover-only。
- **产物**：`index.html`（Before / After / Split）+ `before.html` + `after.html` + `manifest.json` + `CHANGELOG.md`。
- **单文件**：`node scripts/bundle-demo.mjs --in <after.html>`。
- 完整输入契约、忠实度、验证清单：`DEMO.md`。

### 11.7 反馈迭代（ITERATE）

- **拆 CR**：target / current / desired / constraints / acceptance；一次只改用户指到的范围。
- **冲突**：与 P0（reduced-motion、可访问性）冲突时拒绝并解释；与性能预算冲突时给降级。
- **版本化**：改前存 `versions/after-vN.html`；更新 `manifest.json` 与 `CHANGELOG.md`。
- **回复**：改了什么、没改什么、待确认什么、下一轮建议；验收用四态。
- 完整分诊、回滚、回复模板：`ITERATE.md`。

---

## 12. 相关资源

### 新工作流（v3）

- **代码体检协议**：`./AUDIT.md` → 规则库、替换决策、报告模板、demo brief
- **映射与反模式全文**：`./references/mapping.md` · `./references/anti-patterns.md`
- **改版 Demo 协议**：`./DEMO.md` → 输入契约、忠实度、对照壳、验证
- **反馈迭代协议**：`./ITERATE.md` → CR 拆分、版本化、冲突处理、回滚
- **内置交互库**：`./library/motion-kit.css` / `.js` · 用法见 `./library/README.md`
- **56 模式机器清单**：`./library/manifest.json`
- **页面模板（9 套）**：`./templates/` · 索引见 `./templates/README.md`
- **体检器**：`node scripts/audit.mjs <path>`
- **Demo 脚手架**：`node scripts/new-demo.mjs --name <slug>`
- **单文件打包**：`node scripts/bundle-demo.mjs --in <html>`
- **自检**：`node scripts/check.mjs`（语法 / inline script / manifest / 体检回归 / fixtures / 文档链接）
- **烟测 / 验收**：`node scripts/smoke.mjs --viewports 390,768,1280 --report .smoke-report.md`
- **自动化**：`scripts/brief.mjs` / `scripts/iterate.mjs`；脱敏 `scripts/sanitize.mjs`
- **浏览器烟测**：`node scripts/smoke.mjs`（390/768/1280 / reduced-motion / 溢出 / 44px）
- **导出**：`node scripts/export.mjs --in <html> --out <pdf|png>`
- **设计定调**：`./DESIGN.md` + `./design-core/`（tokens / typography / layout / rules / schema）
- **方向与品牌**：`./DIRECTION.md` · `./directions/` · `./BRAND.md` · `./brand/`
- **视觉评审**：`./CRITIQUE.md` + `scripts/critique.mjs`
- **完整链路示例**：`./examples/README.md`（体检报告 → demo brief → 迭代记录）
- **版本记录**：`./CHANGELOG.md`（v3 新增资产与修复）

### 模式 demo 与手册

- **核心 demo（模式 ①-⑩）**：`./10-ui-interactions.html`
- **进阶 demo（模式 ⑪-⑰）**：`./advanced-ui-v2.html`
- **前沿 demo（模式 ⑱-㉕）**：`./advanced-ui-v3.html`
- **移动端手感 demo（模式 ㉖-㉜，手机打开试玩）**：`./mobile-ui.html`
- **高级移动端手感 demo（模式 ㉝-㊵，手机打开试玩）**：`./mobile-ui-pro.html`
- **移动端组件与情绪 demo（模式 ㊶-㊽，手机打开试玩）**：`./mobile-ui-plus.html`
- **前沿 CSS 原生 demo（49-56）**：`./frontier-css.html`
- **配方应用 demo（社区 Feed / 电商结算 / IM 私信）**：`./demo-social-feed.html` · `./demo-checkout.html` · `./demo-messenger.html`
- **模式技术细节 + 代码模板**：`./PATTERNS.md`
- **速查索引**：`./INDEX.md`
- **对抗性测试场景**：`./evals/scenarios.md`
- **GSAP 官方文档**：https://gsap.com/docs/v3/
- **prefers-reduced-motion**：https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

---

## 13. 一句话总结

**任何交互 = 输入源（滚动 / 手势 / 时间 / 光标）× 变换策略（位移 / 缩放 / 视觉 / 路径 / 物理）。**
**先定模块，再查映射表，最后套代码。**

v3 的完整链路：**审代码（证据）→ 选 3–5 项（减法）→ 做 Before/After（同内容）→ 按反馈迭代（版本化）**。
不做视觉打分；不交付没有 reduced-motion 的动效；不把 demo 做成另一款产品。