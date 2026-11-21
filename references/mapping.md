# 模块映射与组合配方

> 从 `SKILL.md` §4–§6 拆出的完整表；章节编号保持原样，便于旧引用。
> 查表结果仍按 `SKILL.md` §11.1 四层输出：必须 / 推荐 / 可选 / 禁止。

## 4. ★ 模块 → 模式 映射表（核心）

> 这是 agent 在接到任务后**直接 lookup 的关键表**。
> 查表结果按 **§11.1 四层分级**输出（必须满足 / 推荐方案 / 可选实验 / 禁止或避免），不输出平铺清单。

### 3.1 通用页面元素

| UI 模块 | 推荐模式 | 关键参数 | 备选 | 注意事项 |
|---------|---------|---------|------|---------|
| **Hero 主视觉** | ① 视差 + ⑤ 文字揭示 | 速度 0.1~0.4；stagger 40ms | ⑨ 3D 倾斜（特性卡） | 视差不超过 3 层；首屏文字 1s 内完成 |
| **Hero 高级背景** | ⑪ 极光 + ⑫ 粒子网络 | blob blur 80px；60~100 节点 | ① 视差（图片） | 不要和视差叠加；移动端降级为纯色 |
| **导航栏 Logo** | ⑥ SVG 路径 | duration 1.5~2.5s | ⑤ 文字揭示（文字 logo） | 路径总长 ≤ 1000 为佳 |
| **主 CTA 按钮** | ④ 磁吸 | 系数 0.2~0.35 | ⑦ 弹性（按下回弹） | 移动端**禁用磁吸**，用普通 hover |
| **点击反馈按钮** | ⑬ 水波纹涟漪 | duration 500~700ms | ⑦ 弹性 | 必须从点击位置发出，不能从中心 |
| **次要操作按钮** | 无 / 普通 hover | — | — | 不要每个按钮都加动效 |
| **数字徽章 / 角标** | ⑧ 数字翻牌（变化时） | ease: expo.out | ⑤ 揭示 | 不要每帧都动画 |
| **Loading 占位** | ⑥ SVG 路径（品牌） / ⑦ 弹性（小球） | 600ms≤ duration≤2s | 简单旋转 | loading < 800ms 直接消失，别用 |
| **空状态插画** | ⑥ SVG 路径 | 顺序绘制 0.5~1.5s | ⑦ 弹性（循环） | 首次出现用单次，不要循环 |

### 3.2 内容类模块

| UI 模块 | 推荐模式 | 关键参数 | 备选 | 注意事项 |
|---------|---------|---------|------|---------|
| **特性卡片网格** | ⑨ 3D 倾斜（hover） | rotate ±8~12°；强度 0.3 | ④ 磁吸（整卡） | 移动端降级为普通 hover |
| **卡片 → 详情页** | ⑮ FLIP 共享元素 | duration 350~500ms | ⑯ View Transitions | 共享元素必须有稳定 key/id；列表 → 全屏 |
| **可滑动 Feed 卡** | ③ 卡片堆叠 | 阈值 80~120px | 普通 swipe-to-dismiss | 屏幕只允许 1 张可拖 |
| **色卡 / 配色面板浏览** | ㉕ Folding Drawer | 偏移 20/14、scale 0.94→0.70 | ⑨ 3D 倾斜（hover） | 书签从卡片延伸，激活 = 暗 / 未激活 = 亮 |
| **有限集合顺序浏览（≤8 项）** | ㉕ Folding Drawer | 5 层阶梯偏移、wheel 锁 200ms | ⑲ 水平叙事 | 不要旋转/折叠 — 抽拉感更高级 |
| **数字展示 / 统计** | ⑧ 数字翻牌 | ease: expo.out | ① 视差（数字墙） | 单次进入动画，不要循环 |
| **图文混合段落** | ② 滚动触发（淡入） | 阈值 0.2；y: 30 | 不动 | 不要用视差，会影响阅读 |
| **轮播 / Banner** | ⑨ 3D 倾斜（active 项） | rotate ±6° | ⑤ 文字揭示 | 一次只强调一张 |
| **长列表** | 无（保持冷静） | — | — | 列表项**不要**加 hover 动效 |

### 3.3 导航与状态

| UI 模块 | 推荐模式 | 关键参数 | 备选 | 注意事项 |
|---------|---------|---------|------|---------|
| **设置开关 / Toggle** | ⑩ 玻璃拟态 | blur 16~24px | 普通 toggle | 模糊过重会掉帧，blur ≤ 24px |
| **主题切换 / SPA 路由** | ⑯ View Transitions | duration 300~500ms | 简单 fade | 必须 Chrome 111+/Safari 18+；旧浏览器降级 |
| **Modal 弹窗** | ⑩ 玻璃拟态 + ⑤ 文字揭示 | blur 20px | fade + scale | 移动端 blur 降到 8~12px |
| **Tab 指示器** | ⑦ 弹性 | k=0.1, d=0.7 | 简单 slide | **不要用 linear** |
| **下拉刷新** | ⑦ 弹性（跟手 + 回弹） | k=0.05, d=0.6 | 简单旋转 | 移动端专用 |
| **Toast / Snackbar** | ⑤ 文字揭示（进入） | duration 0.4s | 普通 fade | 不要持续抖动 |
| **状态变化（on/off）** | ⑩ 玻璃拟态 + ⑦ 弹性 | 200~400ms | 颜色变化 | 颜色 + 形状 + 文字三重提示 |

### 3.4 沉浸式叙事

| UI 模块 | 推荐模式 | 关键参数 | 备选 | 注意事项 |
|---------|---------|---------|------|---------|
| **作品集 / Showreel** | ① 视差 + ⑨ 3D 倾斜 | 慢节奏 0.2~0.3 | ② 滚动触发 | 整页动效要克制 |
| **产品详情页** | ① 视差（背景） + ⑤ 揭示（卖点） | 慢节奏 | ⑨ 3D 倾斜 | 关键信息别藏在动效后 |
| **Onboarding 引导** | ⑤ 文字揭示（顺序） | stagger 60ms | ② 滚动触发 | 每屏 1 个核心动画 |
| **垂直滚动叙事** | ⑭ 粘性滚动堆叠 | 面板 80~120vh | ② 滚动触发 | 移动端改成普通竖排，避免 sticky 卡顿 |
| **品牌故事页** | ⑥ SVG 路径（logo） + ⑤ 揭示 | 总时长 3~5s | ① 视差 | 视频感，不要过密 |
| **营销活动页** | ① 视差 + ④ 磁吸 + ⑤ 揭示 | 节奏快 0.3~0.5 | ⑨ 3D 倾斜 | 必须有"下一步"明确 CTA |
| **AI 产品落地页** | ⑫ 粒子 + ⑰ 流式打字机 | 节点 60~80；字符 20~40ms | ⑪ 极光 + ⑮ FLIP | 流式打字机**必须**配光标，否则不像 AI |
| **AI 对话气泡** | ⑰ 流式打字机 | 字符 20~40ms | ⑥ SVG 路径（图标） | 中途换行要保留换行符；标点延迟 ×3 |
| **高端品牌落地页** | ⑱ 自定义光标 + ⑳ 噪点 + ㉑ Glitch（标题） | 内点立即，外圈 0.18 阻尼；噪点 opacity 0.25；偏移 2~4px | ⑲ 水平叙事 | 移动端禁用光标；噪点要 can-toggle 关闭 |
| **Apple 风产品页** | ⑲ 水平滚动叙事 + ㉒ 滚动驱动数字 | 横向 4~6 屏；数字 0~N | ① 视差 + ⑤ 揭示 | 必须 ScrollTrigger pin + scrub；移动端改竖排 |
| **故障感 / Tech 风** | ㉑ RGB 分离 + ⑳ 噪点 | 关键帧 90%~98% 抖动；噪点 mix-blend-mode: overlay | ⑫ 粒子 | 不要让 Glitch 全程抖，会疲劳 |
| **数据叙事长页** | ㉒ 滚动驱动数字 + ⑧ 翻牌 | progress 0~1 → 0~N；lerp 0.15 | ② 滚动触发 | tabular-nums 防止数字跳动 |
| **Power User 工具** | ㉓ Cmd+K 命令栏 + ⑬ 涟漪（按钮） | 快捷键 Cmd/Ctrl+K；高亮 `<mark>` | ⑫ 粒子（背景） | 必须支持 ↑↓ Enter Esc；空状态文案 |

### 3.5 移动端 / 小程序特殊考虑

| 模块 | 推荐模式 | 关键参数 | 替代 | 注意事项 |
|------|---------|---------|------|---------|
| **小程序启动屏** | ⑥ SVG 路径（logo） | 1.5~2s | 简单淡入 | 动画结束才让用户操作 |
| **小程序下拉刷新** | ⑦ 弹性 | 自定义曲线 | 旋转 spinner | 用 wx.createAnimation |
| **小程序弹窗** | ⑩ 玻璃拟态 + ① 视差（背景层） | blur 8~16px | slide-up | iOS 性能 ≥ iOS 15 才能 blur |
| **App 原生按钮** | ⑦ 弹性（按下） | UIImpactFeedback | 中 | 配合触感反馈 |
| **触底反弹** | ⑦ 弹性 | k=0.06, d=0.65 | overscroll-behavior: contain | 注意 iOS rubber band 冲突 |

### 3.6 ★ 移动端手感模式（㉖-㉜，手机专用）

> agent 在做手机 H5 / WebApp / 小程序时**必须先查这张表**；这些模式解决「顺滑滑动 / 顺滑切换」，是原生 App 手感的分水岭。高级手感模式（㉝-㊵）见 §3.7。

| UI 模块 | 推荐模式 | 关键参数 | 备选 | 注意事项 |
|---------|---------|---------|------|---------|
| **横向卡片轨道（首页/推荐）** | ㉖ snap 滚动 | 卡宽 min(78vw,320px)；mandatory | proximity | 禁 JS 劫持 touchmove；scroll 监听 rAF 节流 |
| **全屏 Onboarding / Stories** | ㉖ snap 滚动 + `scroll-snap-stop: always` | 一屏一页 | ⑭ 粘性堆叠 | 桌面端 snap 改按钮翻页 |
| **整页丝滑滚动（叙事落地页）** | ㉖ Lenis 式 lerp | lerp 0.08~0.12 | 原生滚动 | 信息流/列表页**禁用**平滑滚动 |
| **二级页返回** | ㉗ 滑动返回 | 热区 24px；vx>0.5 提交 | 返回按钮 | 跟手阶段 transition:none；必须保留可见返回按钮 |
| **顶部 Tab / 分段控制** | ㉘ Tab 滑动切换 | 指示器由 scrollLeft 驱动 | ⑦ 弹性指示器 | 选中态等 scrollend 再改；Tab ≤ 6 |
| **列表 → 详情（路由下钻）** | ㉙ push/pop | 0.38s；旧页 -25% 视差 | ⑯ View Transitions | 双层必须同动；spring 做导航 = 廉价 |
| **POI 详情卡 / 筛选面板** | ㉚ Bottom Sheet | 2~3 个 snap 点；backdrop 联动 | slide-up 弹层 | 速度+位移双判定；内容区恢复 pan-y |
| **消息/待办列表行操作** | ㉛ 滑动显露 | 按钮宽 76px；行间互斥 | 长按菜单 | 必须保留可见替代入口；删除配撤销 |
| **主按钮（CTA/发送）** | ㉜ 按压缩放 + 触感 | scale 0.96；vibrate ≤20ms | ⑬ 涟漪 | iOS Safari 无 vibrate，静默降级 |
| **snap 吸附瞬间反馈** | ㉜ snap 触感（4ms） | ㉖⑳㉚ 配套 | 视觉闪烁 | 只在状态改变瞬间震，禁止高频 |
| **长按呼出菜单** | ㉜ long-press 500ms | scale 1.03 + warn 震动 | ⋯ 按钮 | pointerup/cancel/leave 都要清 timer |

### 3.7 ★ 高级移动端手感（㉝-㊵，「原生 App 级」细节）

> 做完 §3.6 骨架后，按场景挑选这些「高阶细节」；每个都是原生 App 和 Web 之间最难被看破的手感差。组件与情绪模式（㊶-㊽）见 §3.8。

| UI 模块 | 推荐模式 | 关键参数 | 备选 | 注意事项 |
|---------|---------|---------|------|---------|
| **内部滚动容器滚到顶回弹** | ㉝ 橡皮筋阻尼 | c=150 对数阻尼 | 原生 body 自带（别重复实现） | `scrollTop≤0` 才接管；松手带 1.2 过冲 |
| **图片查看器 / 画布** | ㉞ Pinch-to-Zoom | origin 锁双指中点；吸附 1.8→2.4 | 双击 toggle | 必须 setPointerCapture + Pointer Map；配 +/− 按钮 |
| **个人主页 / 详情页头图** | ㉟ 坍缩头图 | stretch +0.35 封顶；origin bottom | ① 视差 | 只动 transform + rAF；bar 与头图同半速 |
| **歌单 / 收藏夹 / 看板排序** | ㊱ 拖拽排序 | 长按 300ms 浮起 scale 1.05 | 上/下移按钮 | 让位只动 transform；松手才结算 DOM；换位 snap 触感 |
| **信息流 / 列表页顶部** | ㊲ 下拉刷新完整版 | 阈值 80px；四态状态机 | 系统原生（能覆盖就别自绘） | spinner 跟手旋转延续到 loading；完成态停 500ms |
| **时间/值选择器、自绘滑轨** | ㊳ 惯性甩动 | 摩擦 0.94/frame；反弹 0.4× | ㉖ 原生 snap（能用就用） | 末速取最后 3~5 个 move；接住滑行中的新拖拽 |
| **天气/故事/多任务卡片** | ㊴ 堆叠卡片 | scale 0.05/层；跟进系数 2x | ③ 卡片堆叠 | 只前层可拖；≤4 层；换层后重排事件 |
| **高端 CTA / 播放器进度** | ㊵ 液态填充 | 追赶 0.12；凸起随速度 | ⑬ 涟漪 | 同屏 ≤2 个液态源；文字 mix-blend-mode: difference |

### 3.8 ★ 移动端组件与情绪模式（㊶-㊽）

> 反馈与状态类：解决「点完之后发生了什么」的感知问题。总原则见 PATTERNS「补充律 8/9」—— **反馈从触发点长出来；成功要克制**。

| UI 模块 | 推荐模式 | 关键参数 | 备选 | 注意事项 |
|---------|---------|---------|------|---------|
| **Feed 图片点赞** | ㊶ 双击点赞爆裂 | 爱心从第二击坐标长出；连击 800ms 窗口 | ㊼ 计数 bump | 必须并存可见心形按钮；`touch-action: manipulation` |
| **应用内通知横幅** | ㊷ 横滑关闭 | 微旋转 dx×0.05°；飞出后高度坍缩 | × 按钮 | 与 ㉛ 分工：㉛ 行内露按钮，㊷ 整卡离场；保留 × 按钮 |
| **时间/时长/单位选择** | ㊸ 3D 滚轮 | perspective 在容器；原生 snap + scrollend | ㊳ fling / 原生 select | 底层保留 select/stepper 等价物 |
| **深浅色主题切换** | ㊹ 圆形揭示 | 揭示起点=按钮中心；半径到最远角 | ⑯ VT fade | 无 VT/低端机降级直接翻转 |
| **IM 语音消息** | ㊺ 按住说话 | 上滑 80px 取消；pointercancel=取消 | 点按录音模式 | 最短 500ms 防误触；发送/取消触感要区分 |
| **Feed 首屏加载** | ㊻ 骨架屏 | 骨架与内容逐像素同尺寸；扫光用 transform | 转圈 | <300ms 到达不上骨架；>3s 换错误态 |
| **消息/购物车角标** | ㊼ 角标弹跳 | 1.35 回弹 + 颜色脉冲；void offsetWidth retrigger | ⑧ 翻牌 | tabular-nums；连击合并 bump；配 aria-live |
| **支付/发布成功** | ㊽ 庆祝粒子 | Canvas 130 粒从触点抛出；pointer-events:none | toast | 每用户流 ≤1 处；常规成功只 toast |

### 3.9 ★ 前沿 CSS 原生动效（49–56，渐进增强层）

> 2023–2025 落地的 CSS 原生动画能力，定位是「同类 JS 模式的现代替代/增强」。新项目且浏览器基线允许时**优先推荐本档**（代码量、性能、可维护性全面占优）；老项目按 @supports 渐进增强。发布前 caniuse 复核支持度。

| UI 模块 | 推荐模式 | 关键参数 | 替代的旧方案 | 注意事项 |
|---------|---------|---------|------|---------|
| **滚动 reveal / 进度条 / 视差** | 49 滚动驱动动画 | range entry 60%；fill both | ② ① ㉒ 的 JS 版 | 初始态只写 keyframes from；@supports 包裹 |
| **弹层/dialog/toast 进出场** | 50 @starting-style | 280~360ms；(.32,.72,0,1) | JS class 切换 | 四条 transition 都要列（含 display/overlay） |
| **下拉菜单 / tooltip / 非阻塞通知** | 51 Popover API | auto；manual=常驻 | 手写 modal 脚手架 | 阻塞式确认仍用 dialog+showModal |
| **hover / 指示器落位弹簧** | 52 linear() | 过冲 1.15~1.25；450~650ms | ⑦（非跟手场景） | 拖拽松手回弹仍用 ⑦ rAF |
| **手风琴 / 展开-收起** | 53 grid 0fr→1fr | .38s；min-height:0 | max-height 999px hack | interpolate-size 仅 Chrome，默认用 grid 法 |
| **tooltip / 下拉跟随定位** | 54 锚点定位 | flip-block + flip-inline | JS 计算 + floating-ui | 先写降级基线再 @supports 增强 |
| **多页站列表 ↔ 详情转场** | 55 跨文档 VT | 共享元素 ≤2/页；rel=expect | ⑮ FLIP / 整页白屏跳转 | SPA 用 ⑯；两页同步 view-transition-name |
| **轮播 / snap 轨道指示点** | 56 scroll-marker | 点径 6~8px | JS 点位同步（IO 方案） | 实验性，生产用 IO 兜底 |

---

## 5. 模式速查表（详见 PATTERNS.md）

| # | 模式 | 一句话原理 | 关键参数 | 复杂度 |
|---|------|----------|---------|--------|
| ① | **视差滚动** | 滚动距离 × 速度系数 → 各层 translateY | speed: 0.1~0.5 | ⭐ |
| ② | **滚动触发** | 元素进入视口进度 → 0→1 动画进度 | scrub, threshold 0.2 | ⭐⭐ |
| ③ | **卡片堆叠** | 拖拽跟手 + 阈值飞出 / 弹性回弹 | 阈值 100px, ease: elastic | ⭐⭐⭐ |
| ④ | **磁吸按钮** | 指针偏移 × 0.3 → translate | 强度 0.2~0.4 | ⭐ |
| ⑤ | **文字揭示** | 字符串拆词 → stagger 入场 | stagger 30~60ms, expo.out | ⭐⭐ |
| ⑥ | **SVG 路径** | stroke-dashoffset 100% → 0% | duration 1.5~2.5s | ⭐⭐ |
| ⑦ | **弹性回弹** | F = -kx - cv 每帧更新 | k=0.08, d=0.78 | ⭐⭐⭐ |
| ⑧ | **数字翻牌** | 0~9 垂直堆叠 + translateY(-n*10%) | ease: expo.out | ⭐⭐ |
| ⑨ | **3D 倾斜** | perspective + rotateX/Y 跟光标 | ±10~14° | ⭐⭐ |
| ⑩ | **玻璃拟态** | backdrop-filter: blur() + 半透明 | blur 16~24px | ⭐ |
| ⑪ | **极光渐变** | 多色大圆 + mix-blend-mode: screen + 慢动画 | blur 60~120px, 8~15s 循环 | ⭐ |
| ⑫ | **粒子网络** | Canvas 粒子 + 鼠标排斥 + 临近连线 | 30~100 节点，60fps | ⭐⭐⭐ |
| ⑬ | **水波纹涟漪** | click 位置 → radial ripple span + transform scale | 400~700ms | ⭐ |
| ⑭ | **粘性滚动堆叠** | position:sticky 容器 + 内部面板 scroll-触发动画 | 面板 80~120vh | ⭐⭐ |
| ⑮ | **FLIP 共享元素** | First-Last-Invert-Play 列表→详情平滑过渡 | duration 350~500ms | ⭐⭐⭐ |
| ⑯ | **View Transitions** | document.startViewTransition() 浏览器原生过渡 | duration 300~500ms | ⭐⭐ |
| ⑰ | **AI 流式打字机** | 字符 setState + 可变 delay（标点慢）+ 流式光标 | 字符 15~40ms，标点 ×3 | ⭐⭐ |
| ⑱ | **自定义光标** | 双层光标（点+环）+ 阻尼惯性 + hover 放大 | 内点立即，外圈 lerp 0.18 | ⭐⭐ |
| ⑲ | **水平滚动叙事** | 垂直 scrollY → 水平 translateX（pin + scrub） | scrub 1，4~6 屏 | ⭐⭐⭐ |
| ⑳ | **噪点纹理** | Canvas 随机像素 + steps() 抖动 + mix-blend-mode | 0.5x 分辨率，opacity 0.25 | ⭐ |
| ㉑ | **RGB 分离 Glitch** | 3 层文字（R/G/B）+ mix-blend-mode: screen + 关键帧偏移 | 偏移 2~4px，92~98% 区间 | ⭐ |
| ㉒ | **滚动驱动数字** | ScrollTrigger.progress 0~1 → lerp 数字 0~N | duration 不限，lerp 0.15 | ⭐ |
| ㉓ | **命令栏 Cmd+K** | 全局快捷键唤起 + 模糊匹配 + 键盘导航 + 高亮 | Cmd/Ctrl+K，↑↓ Enter Esc | ⭐⭐⭐ |
| ㉔ | **Blob Morph 液态形变** | SVG `<path>` 的 `d` 属性在同点数 path 间 GSAP morph | elastic.out(1, 0.6) | ⭐⭐ |
| ㉕ | **Folding Drawer 千层酥抽拉** | 同位多卡 + data-stack-pos 阶梯偏移 → 顶卡向左前方 transform 抽出；wheel/touch/keyboard 三模驱动 | offset 20/14、scale 0.94→0.70、cubic-bezier(0.34,1.22,0.64,1) | ⭐⭐ |
| ㉖ | **原生手感滚动** | 原生滚动 + scroll-snap 吸附 + overscroll-behavior 边界；禁 JS 劫持 | snap mandatory/proximity；lerp 0.1 | ⭐ |
| ㉗ | **滑动返回** | 左缘热区 pointerdown → 页面 translateX 跟手 → 位移/速度双判定提交或回弹 | 热区 24px；vx>0.5px/ms 提交 | ⭐⭐⭐ |
| ㉘ | **Tab 滑动切换** | 内容=横向 snap 轨道，指示器 translateX 由 scrollLeft 驱动（免费惯性） | 指示器无 transition；scrollend 更新选中 | ⭐⭐ |
| ㉙ | **页面推入/推出** | 新页 translateX(100%→0)，旧页 -25% 视差后退+变暗，双层同动 | 0.38s；cubic-bezier(0.32,0.72,0,1) | ⭐⭐ |
| ㉚ | **底部抽屉 Bottom Sheet** | 2~3 个 snap 点 + handle 跟手拖拽 + 速度判定归位 + backdrop 联动 | \|vy\|>0.5 甩动直达；handle 热区 44px | ⭐⭐⭐ |
| ㉛ | **列表项滑动操作** | 行内容层跟手 translateX 垫底露出操作钮；过半展开/回弹；行间互斥 | 按钮 76px/个；右侧 dx/4 阻尼 | ⭐⭐ |
| ㉜ | **触感反馈 + 按压缩放** | active scale 0.96 + navigator.vibrate 波形表（tap/snap/success/warn） | 单脉冲 ≤20ms；长按 500ms 放大 | ⭐ |
| ㉝ | **橡皮筋阻尼** | 到顶续拉按 `c*(1-1/(dx/c+1))` 阻尼跟手，松手 spring 回弹 | c≈150；回弹带 1.2 过冲 | ⭐⭐ |
| ㉞ | **捏合缩放 Pinch** | 双指距离比 × baseScale，origin 锁双指中点，松手吸附/回弹 | 边界 0.4~3；吸附阈值 1.8→2.4 | ⭐⭐⭐ |
| ㉟ | **坍缩头图** | 下拉 scale stretch（origin bottom）+ 上滚半速视差 + 吸顶收敛 | stretch ≤ +0.35；视差 0.5× | ⭐⭐ |
| ㊱ | **长按拖拽排序** | 长按 300ms 浮起 → 让位用 transform 预览 → 松手才结算 DOM | scale 1.05；让位 0.25s iOS 曲线 | ⭐⭐⭐ |
| ㊲ | **完整下拉刷新** | 阻尼跟手 + spinner 跟手旋转 + 四态状态机（idle/pulling/loading/done） | 阈值 80px；完成态停 500ms | ⭐⭐ |
| ㊳ | **惯性甩动 Fling** | release 末速延续，rAF 中 `v *= 0.94` 摩擦衰减 + 边界 0.4 倍反弹 | 摩擦 0.94/frame；起甩 0.15px/ms | ⭐⭐ |
| ㊴ | **堆叠卡片页** | 多层 scale 递减退后，前层拖动时后层按 2× 进度提前跟进 | scale 0.05/层；跟进系数 2 | ⭐⭐⭐ |
| ㊵ | **液态填充 Liquid** | SVG 贝塞尔前沿随进度推进，凸起随速度变化（表面张力感） | 追赶 0.12/frame；凸起 14+60×|d| | ⭐⭐ |
| ㊶ | **双击点赞爆裂** | 250ms 双击 → 第二击坐标 spawn 爱心 scale 弹出 + 漂浮 + 连击计数 | 过冲 1.3；连击窗口 800ms | ⭐⭐ |
| ㊷ | **横滑关闭通知** | 整卡 translateX 跟手 + 微旋转 → 阈值飞出 → 高度坍缩合洞 | 旋转 dx×0.05°；opacity 下限 0.45 | ⭐⭐ |
| ㊸ | **3D 滚轮选择器** | item 距中心偏移 → rotateX 圆柱面 + 原生 snap 滚动 + scrollend 落定 | 22°/档；translateZ 中心 28px | ⭐⭐⭐ |
| ㊹ | **主题圆形揭示** | 记录按钮坐标 → startViewTransition + clip-path circle 从触点扩散 | 半径到最远角；480ms iOS 曲线 | ⭐⭐ |
| ㊺ | **按住说话** | 按住起波形抖动+计时，上滑 80px 切取消态，pointercancel 静默取消 | 波形 110ms 节拍；最短 500ms | ⭐⭐⭐ |
| ㊻ | **骨架屏 Shimmer** | transform 扫光 + 骨架与内容逐像素同尺寸 + 完成重叠过渡 | 周期 1.4s；完成 0.3s 淡入上移 | ⭐ |
| ㊼ | **角标弹跳 Badge Bump** | 数字变化 scale 1.35 回弹 + 颜色脉冲 + 「+N」飞出；void offsetWidth retrigger | 1.35 回弹；+N 只在 delta≥2 | ⭐ |
| ㊽ | **庆祝粒子 Confetti** | Canvas 100~150 emoji 从触发点抛出，重力 0.35，落完自动停 rAF | 130 粒；每用户流只 1 处 | ⭐⭐ |
| 49 | **滚动驱动动画** | animation-timeline: view()/scroll()，滚动进度即动画进度 | range entry 60%；fill both | ⭐ |
| 50 | **@starting-style 进出场** | 声明首帧样式 + allow-discrete 让 display 可过渡 | 280~360ms；四条 transition | ⭐ |
| 51 | **Popover API** | top layer 弹层，Esc/外点自动关，零 JS | auto / manual | ⭐ |
| 52 | **linear() 弹簧** | 弹簧曲线采样点编码进 CSS 缓动 | 过冲 1.15~1.25；450~650ms | ⭐ |
| 53 | **height:auto 过渡** | grid-template-rows 0fr→1fr（或 interpolate-size） | .38s；min-height:0 | ⭐ |
| 54 | **锚点定位** | position-anchor + anchor()/position-area 自动翻折 | flip-block + flip-inline | ⭐ |
| 55 | **跨文档 VT** | @view-transition navigation:auto，MPA 共享元素转场 | 共享元素 ≤2/页；rel=expect | ⭐⭐ |
| 56 | **滚动标记** | ::scroll-marker 自动生成轮播指示点（实验性） | 点径 6~8px | ⭐ |

---

## 6. 组合配方（关键）

**一屏最多 2 个主模式 + 1 个次要模式**，否则视觉混乱。

| 配方名 | 组合 | 适用场景 |
|--------|------|---------|
| **Premium Hero** | ① 视差（背景层） + ⑤ 揭示（标题） + ④ 磁吸（CTA） | 落地页首屏 |
| **App Store Card** | ⑨ 3D 倾斜（卡） + ⑧ 数字翻牌（评分） + ⑤ 揭示（标题） | 应用商店 / 推荐位 |
| **Tinder Discover** | ③ 卡片堆叠 + ⑩ 玻璃拟态（操作按钮） + ⑦ 弹性（回弹） | 匹配 / 评估类 |
| **Story Scroll** | ② 滚动触发（元素淡入） + ⑥ SVG 路径（段落标头） + ⑤ 揭示 | 长图文叙事 |
| **Dashboard Premium** | ⑧ 数字翻牌（指标） + ⑩ 玻璃拟态（开关） + ⑦ 弹性（指示器） | 高端仪表盘 |
| **Onboarding Sequence** | ⑤ 揭示（步骤） + ⑥ SVG 路径（图标） + ⑦ 弹性（下一页按钮） | 新用户引导 |
| **Aurora Hero** | ⑪ 极光（背景） + ⑤ 揭示（标题） + ⑬ 涟漪（CTA） | 高端品牌 / SaaS 落地页 |
| **AI Product Demo** | ⑫ 粒子（背景） + ⑰ 流式打字机（演示） + ⑯ View Transitions（主题） | AI 产品落地 / ChatGPT 风格 |
| **Portfolio Showcase** | ⑪ 极光（背景） + ⑭ 粘性堆叠（作品章节） + ⑮ FLIP（作品→详情） | 设计师 / 摄影师作品集 |
| **Native SPA** | ⑯ View Transitions（路由） + ⑬ 涟漪（按钮反馈） + ⑦ 弹性（指示器） | 类原生 APP 体验的 Web App |
| **Premium Brand Landing** | ⑱ 自定义光标 + ⑳ 噪点 + ㉑ Glitch（标题） | Linear / Vercel / Stripe 风的品牌页 |
| **Apple-Style Product** | ⑲ 水平滚动叙事 + ㉒ 滚动驱动数字 + ㉔ Blob（空状态） | Apple 产品页 / 发布会式滚动 |
| **Power User Workspace** | ㉓ Cmd+K + ⑫ 粒子（背景） + ⑬ 涟漪（按钮） | IDE / Dev Tool / 后台类工具 |
| **Data Story Scroll** | ㉒ 滚动驱动数字 + ⑭ 粘性堆叠 + ⑳ 噪点 | 财报页 / 数据长图 / 年度回顾 |
| **Liquid Showcase** | ㉔ Blob Morph + ⑰ 流式打字机 + ⑲ H-Scroll | Stripe 风落地 / Loading / 空状态 |
| **Color Card Stack** | ㉕ Folding Drawer + ⑤ 揭示（顶卡标题） + ⑧ 翻牌（counter） | 配色面板 / 设计系统色卡 / 主题浏览 |
| **Modern Native Stack** | 51 Popover（载体） + 50 @starting-style（进出场） + 54 锚点（定位） | 零 JS 现代弹层（新项目默认） |
| **MPA Flight** | 55 跨文档 VT（列表↔详情共享元素） + 49 滚动驱动（文内 reveal） | 博客 / 官网类多页站 |
| **Native App Feel**（手机） | ㉙ push/pop（路由） + ㉗ 滑动返回 + ㉜ 触感（按钮） | 类原生手机 WebApp 的骨架 |
| **Mobile Feed Premium**（手机） | ㉖ snap 轨道（横滑区） + ㉛ 滑动操作（列表） + ㉜ 按压（CTA） | 首页信息流 |
| **Map / POI App**（手机） | ㉚ Bottom Sheet + ㉖ snap（卡片轨道） + ⑩ 玻璃（顶栏） | 地图、外卖、点评 |
| **Tabbed Home**（手机） | ㉘ Tab 滑动切换 + ⑤ 揭示（首屏） + ㉜ snap 触感 | 社区/资讯首页 |
| **iOS-Grade Profile**（手机） | ㉟ 坍缩头图 + ㊲ 下拉刷新 + ㉜ 触感 | 个人主页 / 详情页 |
| **Gallery Viewer**（手机） | ㉞ Pinch 缩放 + ㉗ 滑动返回 + ㉜ 触感 | 相册 / IM 图片 / 地图 |
| **Power Editor List**（手机） | ㊱ 拖拽排序 + ㉛ 滑动操作 + ㉜ 长按菜单 | 歌单 / 看板 / 收藏夹 |
| **Immersive Stack App**（手机） | ㊴ 堆叠卡片 + ㉝ 橡皮筋 + ㊵ 液态 CTA | 天气 / 故事 / 沉浸式卡片 App |
| **Social Feed Premium**（手机） | ㊶ 双击点赞 + ㊼ 角标 bump + ㊻ 骨架屏 | 社区 / 图片流 |
| **Checkout Flow**（手机） | ㊹ 圆形主题揭示 + ㊽ 庆祝粒子（仅支付成功） + ㉜ 触感 | 电商结算 / 下单完成 |
| **Messenger Feel**（手机） | ㊺ 按住说话 + ㊷ 横滑关闭通知 + ㊼ 未读角标 | IM / 私信 |

---
