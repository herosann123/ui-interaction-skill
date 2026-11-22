# 框架适配

两个薄适配层，不引入运行时依赖：

- `react.js`：`useMotionKit()` / `useMotionKitToast()` / `useMotionKitStream()`
- `vue.js`：`vMotionKit` 指令 / `useMotionKit()`

## React

```jsx
import { useMotionKit } from 'motion-kit/react';

export function FeatureCard() {
  const ref = useMotionKit();
  return (
    <article ref={ref} className="mk-card" data-reveal data-tilt="7">
      <div className="mk-tilt-glow" aria-hidden="true" />
      <h3>实时看板</h3>
    </article>
  );
}
```

- `useMotionKit` 在 `useEffect` 里扫描 ref 子树；动态新增节点时再调用一次 `MotionKit.init(node)`。
- 不自动 `destroy()`，避免卸载局部组件时清掉页面级监听；离开页面时手动 `MotionKit.destroy()`。
- SSR：`MotionKit` 在 Node 下是 no-op，`useEffect` 不会在服务端执行。

## Vue 3

```js
import { createApp } from 'vue';
import { vMotionKit } from 'motion-kit/vue';

app.directive('motion-kit', vMotionKit);
```

```vue
<template>
  <article v-motion-kit class="mk-card" data-reveal data-tilt="7">
    <div class="mk-tilt-glow" aria-hidden="true"></div>
    <h3>实时看板</h3>
  </article>
</template>
```

- 指令在 `mounted` / `updated` 时调用 `MotionKit.init(el)`。
- 需要 toast / stream 时用 `useMotionKit()`。

## 注意

- 这些适配层是「复制进项目」的薄封装，不是 npm 上已发布的包；`library/package.json` 只提供 exports 映射，方便本地打包。
- 如果项目有严格的 SSR / hydration，建议只在客户端组件（`'use client'` / `onMounted`）中使用。
- 组件库见 `../../components/`，页面模板见 `../../templates/`。
