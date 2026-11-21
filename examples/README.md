# 示例 · 一条完整的「体检 → Demo → 迭代」链路

> 这里不是额外功能，是把 `AUDIT.md` → `DEMO.md` → `ITERATE.md` 跑一遍的参考产物。
> 真实项目替换路径与内容即可。

---

## 1. 先看结果

打开：

```
templates/demo-shell/index.html
```

- 默认 After；按 `1` 看 Before，按 `3` 并排。
- 右侧「改动说明」是 `DEMO.md` 要求交付的说明面板。
- Before 是一个故意堆了反例的页面；After 是同一份内容的升级版。
- 按 `D` 切 390px；按 `N` 开关说明。

---

## 2. 体检示例

- 原始报告：`audit-report-before.md`
- 交接 brief：`demo-brief.md`
- 复现命令：

```bash
node scripts/audit.mjs templates/demo-shell/before.html
```

报告里能看到 36 项命中、P0 1 / P1 11 / P2 24；不要被数量吓到——真实交付只挑 5 项进 demo，
其余进「可选实验 / 暂不处理」。`demo-brief.md` 展示了这个取舍。

---

## 3. 从零生成一个同类目录

```bash
node scripts/new-demo.mjs --name northwind-demo --title "Northwind 改版"
```

然后：

1. 把 `before.html` 换成用户真实页面。
2. 把 `after.html` 的文案/品牌换成用户内容（保留结构）。
3. 改写 `index.html` 右侧说明。
4. 按 `DEMO.md` §7 验证。

---

## 4. 迭代示例

`iteration-example.md` 展示了两轮反馈如何拆成 CR、改了什么、如何记录版本。
真实使用时，把 `after.html` 复制到 `versions/after-vN.html`，再改 `after.html`。

---

## 5. 文件说明

| 文件 | 是什么 |
| --- | --- |
| `audit-report-before.md` | 扫描器对 `before.html` 的原始输出（带示例说明头） |
| `demo-brief.md` | 从报告里选 5 项后的 DEMO 交接 brief |
| `iteration-example.md` | 两轮反馈的 CR + CHANGELOG 示例 |

> 注意：这些示例只用于演示流程，不是「最佳实践打分」；真实项目以用户内容与约束为准。
