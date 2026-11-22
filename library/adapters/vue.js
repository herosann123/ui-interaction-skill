/**
 * Motion Kit · Vue 3 adapter
 *
 * import { vMotionKit, useMotionKit } from 'motion-kit/vue';
 * app.directive('motion-kit', vMotionKit);
 * <div v-motion-kit data-reveal data-tilt="7">...</div>
 */
import MotionKit from '../motion-kit.esm.js';

export const vMotionKit = {
  mounted(el) {
    if (MotionKit) MotionKit.init(el);
  },
  updated(el) {
    if (MotionKit) MotionKit.init(el);
  },
};

export function useMotionKit() {
  return {
    init(el) {
      if (MotionKit) MotionKit.init(el);
    },
    toast(message, options) {
      if (MotionKit) MotionKit.toast(message, options);
    },
    stream(el, text, options) {
      if (!MotionKit) return Promise.resolve();
      return MotionKit.stream(el, text, options);
    },
  };
}
