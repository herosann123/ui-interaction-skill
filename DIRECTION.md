# 设计方向 · DIRECTION 协议

> 在写第一版页面之前，先让用户看到 **3 个真实方向**。
> 不是三张配色卡，是三套能点、有标题/正文/按钮/字体的 HTML。
> 只对新视觉任务生效；代码体检、小修、单组件直接做。

---

## 1. 什么时候触发

**触发**：

- 从零做页面 / App 原型 / 品牌页 / 营销页
- 现有页面“不够高级 / 像模板”，需要重新定视觉方向
- 用户说“给我几个方案 / 我先看看方向”
- 新增一个完整模板或案例

**不触发**：

- 代码体检（`AUDIT.md`）
- 单个按钮 / 组件 / 文案的小修
- 同一项目已选定方向后的迭代（除非用户要求换方向）
- 修 bug、加一个交互、跑验收

判断不清时：**先做，但把方向选择权留给用户**；不要偷偷做第一版。

---

## 2. 三套逻辑，六个候选

每次出 6 个候选，挑 3 个做成真实方向：

| 逻辑 | 怎么找 | 看什么 |
|---|---|---|
| **最佳设计师** | 这个题材预算无上限时最适合的设计师/工作室 | 思维与构图，不是表面装饰 |
| **现实参照** | 同媒介、同受众的出色作品 | 先截图再看，量结构/信息顺序 |
| **秒数轮盘** | 从 `directions/` 9 套样张随机抽 | 先看真实样张，再决定借哪层 |

规则：

- 6 个候选各写一张方向卡：一句定位 + 适合谁 + 借哪一层
- 挑 3 个**最强、彼此最不一样、不撞外观账本**的做成完整版
- 3 个完整版都必须是真实 HTML，不是缩略图页
- 另外 3 个用一两句话作为备选告诉用户
- **摆出来就停**，等用户选；不要自己替用户拍板

有来源的候选：**借一层，不借一身**。
只借结构、信息顺序、机制；配色、字体、形状从这次题材重新长。
做完和参照并排看，像它的换皮版就换掉表达层。

---

## 3. 用哪 9 套样张

`directions/index.html`：

1. `editorial-warm` 暖纸衬线：品牌 / 内容 / 作品集
2. `editorial-ink` 深墨旧金：出版 / 文化 / 酒店
3. `gallery-swiss` 极简瑞士：工作室 / 摄影 / SaaS
4. `gallery-brutalist` 粗野荧光：独立杂志 / 活动 / 实验品牌
5. `deep-terminal` 终端薄荷：DevTool / AI 基础设施 / 监控
6. `deep-aurora` 深空柔光：AI / 创作者工具 / 夜间
7. `old-heritage` 墨绿旧金：酒店 / 地产 / 财经
8. `old-luxe` 墨黑夜金：会员制 / 高端服务 / 限量
9. `soft-care` 柔和晨雾：健康 / 教育 / 日常工具

选择原则：

- 先看题材，不先看“我喜欢哪个”
- 3 个方向不要同一家族；3 个都暖纸衬线 = 没有选择
- 最多一个“用力过头”（整页做成道具/万能隐喻）
- 方向词收窄解释空间，不转移选择权：「Apple 风格」= Apple 语境里的三种诠释

---

## 4. 生成 3 个方向页

```bash
node scripts/direction.mjs \
  --title "Northwind 改版" \
  --copy "把产品、增长与收入数据放进同一块看板。" \
  --slug northwind \
  --out directions/runs/northwind
```

默认会选三个不同家族的样张（可用 `--directions editorial-warm,gallery-swiss,deep-terminal` 指定）。

输出：

```
directions/runs/northwind/
├── index.html            # 3 个方向并排入口
├── direction-a.html      # 方向 A（真实 HTML）
├── direction-b.html
├── direction-c.html
└── DIRECTIONS.md         # 方向卡 + 选择清单 + 推荐
```

用户选定后，把选择写进：

```
directions/runs/northwind/direction-approved.md
```

内容只需：

```markdown
# Direction approved
- chosen: gallery-swiss
- why: 用户原话 / 理由
- date: 2026-11-26
- next: design.json + 实现
```

---

## 5. 接到 design.json

方向确定后：

```bash
node scripts/design-brief.mjs --archetype gallery --density normal \
  --layout landing --out design.json
```

把方向映射到 archetype：

| 方向 | design-core archetype |
|---|---|
| editorial-warm / editorial-ink | `editorial` |
| gallery-swiss / gallery-brutalist | `gallery` |
| deep-terminal / deep-aurora | `deep-space` |
| old-heritage / old-luxe | `old-money` |
| soft-care | `gallery`（或自定义 tokens） |

然后走 `DESIGN.md` → `DEMO.md`。方向页里的颜色/字体值可以直接进入 `design.json` 与 `design-core` tokens。

---

## 6. 反 AI-slop 守卫

不加约束时，默认会滑向：暖奶油底、高反差衬线、陶土色、全大写小标签、01/02/03 编号。
它本身不丑，但和题材无关地出现，就是“AI 做的”。

每次方向阶段先做三件事：

1. **看题材**：这个产品/内容的现实物件、材质、场景是什么？
2. **查账本**：`node scripts/design-ledger.mjs --show` 看最近 5 次是否同一家族
3. **避开默认**：如果 3 个方向都在暖纸衬线/深底单点缀，至少换掉一个

外观家族不是禁令；三版挤在同一家族才是问题。

---

## 7. 证据与边界

- 方向页必须真实可打开；截图/录屏才算证据
- 没有品牌资产 → 明确写“缺失”，不用假 logo
- 没有真实内容 → 用明确标注的占位，不编客户/数据
- 方向阶段不做完整代码实现；选定后才做
- 不把三方向门强加给代码体检和小修

---

## 8. 交接

- 给 `DESIGN.md`：选定方向 + 品牌资产 + 文案约束
- 给 `DEMO.md`：3 个方向页作为 Before/After 的 Before 参考
- 给 `AUDIT.md`：方向选定后再做代码级体检，避免用代码问题否定视觉方向
- 给 `CRITIQUE.md`：方向页也可作为 6 维评审对象
