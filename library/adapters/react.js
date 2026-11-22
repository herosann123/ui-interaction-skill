/**
 * Motion Kit · React adapter
 *
 * import { useMotionKit, useMotionKitToast } from 'motion-kit/react';
 *
 * function Card() {
 *   const ref = useMotionKit();
 *   return <div ref={ref} data-reveal data-tilt="7">...</div>;
 * }
 */
import { useEffect, useRef } from 'react';
import MotionKit from '../motion-kit.esm.js';

/**
 * 在挂载后扫描 ref 子树里的 data-* 行为。
 * 不调用 destroy()，避免卸载一个组件时清掉页面级监听；需要整页清理时手动调用 MotionKit.destroy()。
 */
export function useMotionKit() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !MotionKit) return;
    MotionKit.init(ref.current);
  }, []);

  return ref;
}

/** 返回一个稳定的 toast 函数；SSR 下是 no-op。 */
export function useMotionKitToast() {
  return function toast(message, options) {
    if (MotionKit) MotionKit.toast(message, options);
  };
}

/** 流式文本：返回 Promise；SSR 下直接完成。 */
export function useMotionKitStream() {
  return function stream(el, text, options) {
    if (!MotionKit) return Promise.resolve();
    return MotionKit.stream(el, text, options);
  };
}
