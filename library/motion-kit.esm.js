/**
 * Motion Kit · ESM wrapper
 * 给 bundler / React / Vue 项目使用；浏览器全局用法仍走 motion-kit.js。
 */
import './motion-kit.js';

const scope = typeof window !== 'undefined' ? window : globalThis;
const MotionKit = scope.MotionKit;

export { MotionKit };
export default MotionKit;
