# 主题 Preset

三套可直接叠加在 `motion-kit` 上的主题令牌；不是新组件库，只换 `--mk-*` 与页面基础色。

| 文件 | 气质 | 适合 |
|---|---|---|
| `editorial.css` | 暖纸、衬线、陶土色 | 品牌页 / 作品集 / 内容产品 |
| `glass.css` | 深空、冷色、玻璃 | AI 产品 / 开发者工具 / 夜间后台 |
| `soft.css` | 浅灰、柔和绿、低对比 | 健康 / 教育 / 日常工具 |

## 使用

```html
<link rel="stylesheet" href="library/motion-kit.css">
<link rel="stylesheet" href="presets/editorial.css">

<section data-theme="editorial">
  <button class="mk-btn mk-btn--primary">开始</button>
</section>
```

- `data-theme` 可以放在 `<body>`、页面区块或 iframe 内；令牌会向下继承。
- 页面自己的背景/文字用 `var(--bg)` / `var(--ink)` / `var(--muted)`。
- 不要在同一个 `data-theme` 区块里混用另一套令牌；需要局部换肤时嵌套一个新的 `data-theme`。
- 预览：`presets/index.html`。
