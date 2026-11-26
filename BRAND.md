# 品牌资产 · BRAND 协议

> 只要设计里出现**具体品牌**或**可识别的产品**，就必须先拿到真实资产。
> 资产 > 规范：官方 logo、产品图、UI 截图，比凭记忆写一个色值重要得多。

---

## 1. 什么时候必须做

两类都触发：

1. 为某个品牌做物料（官网、落地页、宣传图、PPT、原型）
2. 设计里出现任何可识别的产品或品牌（对比、榜单、评测、介绍）

出现几个产品就取几个官方 logo；不是“有就用，没有就算了”。

---

## 2. 五步协议

### ① 问

先问用户有没有品牌资产包 / design system / 已上线页面 / 官方 press kit。
已有就优先用，不要重新发明。

### ② 搜官方渠道

- 官网、官方 press kit、官方 GitHub、官方社媒
- 不要用第三方 logo 站、不要用带水印的图
- 找不到就明确告诉用户缺什么，不要画一个“差不多”的

### ③ 下载与命名

```
brand/
├── brand.json
├── logo.svg
├── product-01.png
├── ui-dashboard.png
└── SOURCES.md
```

- 保留原始文件；不要反复压缩
- 文件名写清用途与版本
- 记录来源 URL、下载日期、许可

### ④ 核验

- logo 是否清晰、透明背景、比例正确
- 产品图是否是当前版本，不是旧款
- UI 截图是否与当前产品一致
- 色值从官方资产取，不从记忆取
- 事实（版本号、发布时间、规格）先核验再写进页面

### ⑤ 固化成 `brand.json`

```json
{
  "brand": "Northwind",
  "assets": {
    "logo": "brand/logo.svg",
    "productShots": ["brand/product-01.png"],
    "uiScreenshots": ["brand/ui-dashboard.png"]
  },
  "colors": {
    "bg": "#f7f3ea",
    "ink": "#1a1510",
    "accent": "#b4552f",
    "accentInk": "#fff8f0"
  },
  "fonts": {
    "display": "Fraunces",
    "body": "Inter"
  },
  "sources": [
    "https://example.com/press",
    "https://example.com/brand"
  ],
  "verifiedAt": "2026-11-26",
  "notes": "logo 来自官方 press kit；产品图为 2026 Q4 版本"
}
```

字段约束见 `brand/brand.schema.json`。

---

## 3. 校验

```bash
node scripts/brand-check.mjs --in brand/brand.json
```

检查：

- 必填字段与类型
- 资产文件是否存在、非空
- 颜色是否为合法 hex
- `sources` 是否非空
- 有无“假 logo / 占位图”标记
- 正文/背景对比度（如果提供 `bg` / `ink`）

没有真实资产时：

- `assets.logo` 写 `null`
- 在 `notes` 写“未找到官方 logo，本 demo 使用文字标识”
- 页面里不要画一个假的品牌 logo

---

## 4. 和 design-core 的关系

- `brand.json.colors` 可以直接映射到 `design-core/tokens.css` 的 `--bg / --ink / --accent`
- `brand.json.fonts` 映射到 `--font-display / --font-body`
- 品牌资产是 `design.json` 的上游；先有品牌，再定方向

---

## 5. 事实核验

涉及产品存在性、发布状态、版本号、规格、价格：

- 先查官方来源，再写进页面
- 查不到就问用户，不要凭记忆断言
- 在 `brand.json.notes` 或页面注脚写“截至 2026-11-26”
- 不要把“我记得还没发布”当作事实

---

## 6. 边界

- 不下载/使用无授权素材
- 不伪造品牌 logo、产品截图、客户评价
- 不用第三方带水印图
- 不在页面里写无法核验的销量/排名/评分
- 资产缺失时明确标注，不用 emoji 或灰块假装
