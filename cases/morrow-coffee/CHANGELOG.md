# CHANGELOG · Morrow Coffee 结算流

> 每次按用户反馈修改后追加一条；修改前把当前 `after.html` 复制到 `versions/after-vN.html`。

## v1 · 2026-11-28

- 从模板 `checkout` 初始化；design-core editorial / normal / flow
- 本次范围：表单语义、原生选项、支付 loading、小费控件、design-core、性能与 reduced-motion
- 对照壳：`index.html`（Before / After / Split）

### 改了什么

- placeholder-only 表单 → label + 16px + focus-visible
- div onclick 选项 → 原生 radio + label
- 支付 CTA → button + loading + 防重
- touchmove 小费滑轨 → 原生 0/5/10% 选项
- 蓝灰模板 → design-core editorial tokens
- 删除 30px blur、transition: all、width 动画、100vh

### 验证

- before 体检 23 项（P0 1 / P1 14 / P2 8）
- after 体检 0 项
- smoke 390/768/1280 + reduced-motion 通过
- 键盘可完成表单、选项与支付

## 待办

- [ ] `before.html` 已换成真实内容
- [ ] `after.html` 文案 / 品牌已替换
- [ ] 右侧改动说明已更新
- [ ] 跑 `node scripts/audit.mjs cases/morrow-coffee/after.html`
- [ ] 检查 reduced-motion、键盘、390px 视口
