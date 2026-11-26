# 模板迁移到 Design Core

## 状态

| 模板 | 主题 | 状态 |
|---|---|---|
| `demo-shell/after.html` | editorial + 陶土 accent | ✅ 已迁移 |
| `hero/` | deep-space + lime accent | ✅ 已迁移 |
| `feature-grid/` | editorial + green accent | ✅ 已迁移 |
| `mobile-feed/` | editorial + green accent | ✅ 已迁移 |
| `mobile-detail/` | editorial + green accent | ✅ 已迁移 |
| `checkout/` | editorial + 陶土 accent | ✅ 已迁移 |
| `settings/` | editorial + green accent | ✅ 已迁移 |
| `ai-chat/` | deep-space + blue accent | ✅ 已迁移 |
| `dashboard/` | editorial + `data-scheme="dark"` | ✅ 已迁移（保留独立深浅色） |
| `demo-shell/index.html` | 对照壳 UI | ➖ 不是设计页面 |

## 迁移步骤

1. `<head>` 里在 `motion-kit.css` 之前加：
   ```html
   <link rel="stylesheet" href="../../design-core/tokens.css">
   ```
2. `<html>` 加：
   ```html
   <html lang="zh-CN" data-theme="editorial" data-density="normal">
   ```
3. 把模板的 `:root { ... }` 从「完整色板」改成「品牌 accent 覆盖」：
   ```css
   :root {
     --accent: #b85940;
     --accent-2: #2f5d50;
     --green: #2f5d50;
     --gold: #c9a368;
     --ink-soft: #4f4a41;
     --mk-accent: var(--accent);
     --mk-surface: var(--panel);
     --mk-ink: var(--ink);
     --mk-border: var(--line);
   }
   ```
4. 字体用 `--font-display / --font-body / --font-mono`；模板旧的 `--serif / --sans / --mono` 由 design-core 自动别名。
5. 跑：
   ```bash
   node scripts/audit.mjs templates/<name>/index.html
   node scripts/screenshot.mjs --in templates/<name>/index.html --out shot.png
   ```
6. 和迁移前截图并排看；只允许轻微色差，不允许布局/层级变化。

## 不要做什么

- 不要为了迁移重写模板布局。
- 不要把 `--mk-*` 全部写回模板，design-core 已经桥接。
- `dashboard` 用 `data-scheme="light|dark"` 保留独立深浅色，基础 tokens 来自 design-core editorial。
- 不要在模板里再定义第二套 type scale / spacing。
