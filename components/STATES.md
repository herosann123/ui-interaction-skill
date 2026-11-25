# 组件状态矩阵

> 写组件第一行样式之前，先列状态。漏掉的状态就是未来的 bug。
> 完整规则见 `../design-core/rules.md` §6–7。

## 8 态

| 状态 | 何时存在 | 必须表达 | 示例 |
|---|---|---|---|
| default | 静止可交互 | 可点击暗示 | `buttons.html` 主/次/玻璃 |
| hover | 仅 `hover:hover` 设备 | 可点击确认 | `.mk-btn` / 组件页 |
| focus | 键盘 Tab | `:focus-visible` 焦点环 | `components.css` `.field input` |
| active | 按下瞬间 | scale / 加深 | `.mk-btn:active` |
| disabled | 不可用 | 降透明 + `not-allowed` + 原因 | `buttons.html` 禁用 |
| loading | 异步进行中 | 转圈/进度 + 禁止重复提交 | `buttons.html` 开始加载 |
| error | 校验/请求失败 | 颜色 + 文字 + 图标 | `forms.html` `.is-invalid` / `feedback.html` |
| success | 完成 | 确认 + 下一步 | `feedback.html` 成功 alert / toast |

## 表单

- 单字段 `blur` 后即时校验；提交时全量校验。
- 输入中不清错误，改回合法才清。
- 错误文字说“怎么修”，用 `aria-describedby` 关联。
- 提交中按钮 loading + 禁用（防重）。
- 输入字号 ≥16px；label 必须真实关联。

## 页面四态

`loading → content OR empty OR error`，成功给下一步入口。

| 状态 | 要求 | 反模式 |
|---|---|---|
| loading | 骨架屏 > spinner；占位防跳动 | 白屏转圈 >1s |
| empty | 解释为什么空 + 出口 | 一行“暂无数据” |
| error | 发生了什么 + 重试 + 兜底 | 白屏 / 纯红字 |
| success | 明确确认 + 下一步 | 静默成功 |

## 自动检查

- `node scripts/design-lint.mjs`：检查组件页是否覆盖关键状态选择器。
- `node scripts/audit.mjs`：动效/性能/可访问性。
- `node scripts/smoke.mjs`：390px + reduced-motion + 控制台错误。
