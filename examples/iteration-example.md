# 示例 · 两轮反馈如何迭代

> 场景：用户看完 `templates/demo-shell` 的 After 后提了两轮反馈。
> 演示 `ITERATE.md` 的 CR 拆分、版本化、冲突处理与记录。

---

## 第一轮反馈

用户原话：

> "整体不错。CTA 有点太跳了，能不能收一点？另外手机上评价区我划不动，是不是坏了？"

### CR 拆分

```yaml
CR-1:
  target: after.html › Hero 主 CTA + 导航 CTA
  current: 磁吸 0.3 + 涟漪 + 按压缩放，位移约 10px
  desired: 更克制，不要追着鼠标跑
  constraints: 桌面保留跟手；触摸端不依赖 hover
  priority: 中
  acceptance: 磁吸位移 ≤6px；缩小时仍能看出反馈；reduced-motion 无位移

CR-2:
  target: after.html › 客户评价 rail
  current: .mk-snap 横滑；桌面滚轮/触控板可滚，手机上应可滑
  desired: 手机上能顺滑横滑，不劫持页面纵向滚动
  constraints: 不引入 JS 滚动库
  priority: 高
  acceptance: 390px 真机/模拟器可横滑；纵向页面滚动不受影响
```

### 分诊

- CR-1 是参数调整 → 直接改 `data-magnetic="0.3"` → `0.18`，并给 CTA 加 `max` 限制。
- CR-2 先复现：检查 rail 是否被父级 `overflow: hidden` 裁掉、是否有元素覆盖。
  结果是 `.mk-snap` 正常，但外层 section 没有给 `touch-action`，且 demo 壳的 iframe 在手机上抢了手势。
  修：给 rail 父级 `touch-action: pan-x pan-y`？不——横向 rail 本身应 `pan-x`，页面纵向仍可滚。
  实际把 rail 的 `touch-action` 显式设为 `pan-x`，并确认 `overscroll-behavior-x: contain`。

### 版本记录

```markdown
## v2 · 2026-11-20

### CR-1 · CTA 收敛
- 磁吸 0.3 → 0.18；位移上限从 ~10px 降到 ~6px
- 保留涟漪与按压；触摸端不变
- 验收：桌面跟手 ✅ / reduced-motion 无位移 ✅

### CR-2 · 评价区手机横滑
- 复现：390px 下 rail 可滚，但父级手势竞争导致偶发不跟手
- 修复：`.rail { touch-action: pan-x; overscroll-behavior-x: contain; }`
- 验收：390px 模拟滑动 ✅ / 页面纵向滚动 ✅

### 未处理
- 用户提到「整体再高级一点」：范围太大，未在本轮动；等具体到区块再做。
```

---

## 第二轮反馈

用户原话：

> "评价区现在能滑了。能不能自动轮播？像之前那样每 3 秒翻一页。还有那个 FAQ 打开有点慢。"

### 分诊

| 反馈 | 判断 | 回应 |
| --- | --- | --- |
| 自动轮播 | 与「setInterval 轮播」反模式冲突；会抢控制权 | 不恢复定时器；提供「可选自动播放 + 暂停」的折中，默认关闭 |
| FAQ 打开慢 | 参数问题；当前 380ms | 调到 280ms，并确认 reduced-motion 下瞬时 |

### CR

```yaml
CR-3:
  target: 评价 rail
  current: 手动 snap
  desired: 自动轮播
  constraints: 不牺牲用户控制
  priority: 低
  decision: 不按原样实现；改为可选「播放/暂停」按钮，默认暂停，间隔 5s；悬停/聚焦暂停
  acceptance: 默认不动；点播放才走；有可见暂停；reduced-motion 不自动播放

CR-4:
  target: FAQ 展开
  current: grid-template-rows 380ms
  desired: 更快
  priority: 中
  acceptance: 280ms；reduced-motion 瞬时
```

### 版本记录

```markdown
## v3 · 2026-11-20

### CR-3 · 自动轮播（折中）
- 未恢复 setInterval；新增播放/暂停按钮，默认暂停，间隔 5s
- 用户悬停 / 聚焦 / 手动滑动时暂停
- reduced-motion 下默认不自动播放
- 说明：与「轮播不抢控制权」原则的折中，已告知用户

### CR-4 · FAQ 时长
- 380ms → 280ms；其余不变
- 验收：打开/关闭 ✅；reduced-motion 瞬时 ✅
```

---

## 这轮示例说明了什么

1. **不是所有反馈都照做**：自动轮播与原则冲突，给折中而不是静默拒绝。
2. **先复现再改**：手机滑不动不一定是 snap 的问题，可能是父级手势竞争。
3. **版本可回滚**：每轮都保留 `versions/after-vN.html`。
4. **记录未处理项**：范围太大的「整体再高级一点」不混进本轮。
5. **验收用证据**：写「✅」的项都要有实际操作/截图，不能只写「已修复」。
