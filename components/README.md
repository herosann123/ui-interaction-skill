# 组件库 · Components

> 比整页模板更常用的「零件」：复制 HTML / 类名 / data 属性到项目，不需要构建。
> 依赖 `../library/motion-kit.css` 与 `.js`；颜色通过 `--mk-*` 覆盖。

| 文件 | 内容 |
|---|---|
| `buttons.html` | 主/次/玻璃/危险/禁用按钮、尺寸、图标、磁吸、涟漪、触感、加载态 |
| `feedback.html` | toast、骨架屏、空状态、错误/成功、确认弹窗 |
| `forms.html` | 输入、选择、开关、checkbox/radio、校验与提交反馈 |
| `navigation.html` | Tabs、面包屑、分页、分段控制、手机底栏 |
| `data.html` | 统计卡、表格、进度、角标、火花线 |
| `components.css` | 组件页外壳；不是组件本身的样式 |
| `STATES.md` | 8 态矩阵 / 表单规则 / 页面四态 / 自动检查 |

## 使用

1. 复制对应页面的 HTML 片段。
2. 引入 `library/motion-kit.css` 与 `library/motion-kit.js`。
3. 用项目的设计令牌覆盖 `--mk-*`，不要改组件内部颜色。
4. 删除演示用的 `data-toast` / `data-modal-open` 占位，换成真实行为。

## 组件原则

- 最小点击区 44px；图标按钮必须有 `aria-label`。
- 输入字号 ≥16px（防 iOS 聚焦缩放）；label 必须真实关联。
- 破坏性操作二次确认，按钮写具体动作。
- 反馈从触发点长出来；toast 同一时间只保留一个。
- 骨架屏与真实内容同尺寸；<300ms 到达的内容不上骨架。
- 表格用 `<table>` + `scope`；小屏横向滚动，不压缩到不可读。
- 所有动效必须有 `prefers-reduced-motion` 静态版（库内已处理）。

## 与库/模板的关系

- 库原语与 API：`../library/README.md` / `../library/manifest.json`
- 整页模板：`../templates/README.md`
- 模式原理：`../PATTERNS.md` / `../INDEX.md`
- 体检与改版流程：`../AUDIT.md` / `../DEMO.md` / `../ITERATE.md`
