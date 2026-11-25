# 主题 Preset（兼容层）

> **canonical 是 `../design-core/tokens.css`**。这里的文件只保留旧链接的兼容入口。

| 文件 | 映射 |
|---|---|
| `editorial.css` | design-core `editorial` |
| `gallery.css` | design-core `gallery` |
| `deep-space.css` | design-core `deep-space` |
| `old-money.css` | design-core `old-money` |
| `glass.css` | 旧别名 → `deep-space` |
| `soft.css` | 旧别名 → `gallery` |

使用：

```html
<link rel="stylesheet" href="design-core/tokens.css">
<html data-theme="editorial" data-density="normal">
```

`design-core/index.html` 是 4 套 archetype 的正式预览；`presets/index.html` 保留旧入口。
