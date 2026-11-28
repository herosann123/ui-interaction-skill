# 交付笔记 · Morrow Coffee 结算流

- 生成时间：2026-11-28T14:01:48.584Z
- 模板：checkout
- 目录：`cases/morrow-coffee`

## 在浏览器打开

直接双击 `index.html`（无需构建）。快捷键：`1/2/3` 切换 Before / After / Split，`D` 切换 390px，`N` 开关改动说明。

## 交付前自检

1. Before 与 After 使用同一份文案与信息层级（只改交互 / 质感）。
2. After 在 390px 与桌面都无横向溢出；输入字号 ≥16px。
3. 所有动效有 `prefers-reduced-motion` 静态版。
4. 弹层 / 抽屉 / Tab 可用键盘操作，Esc 可关闭。
5. 对照壳「改动说明」与 manifest 的 patterns 一致。
6. 完成后把 manifest.status 改为 `review`，收集反馈后进入 `ITERATE.md` 流程。
