export type HapticKind = 'tap' | 'snap' | 'success' | 'warn';

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface StreamOptions {
  speed?: number;
  caret?: boolean;
  instant?: boolean;
}

export interface ToastOptions {
  duration?: number;
}

export interface FlipOptions {
  duration?: number;
  easing?: string;
}

export interface AnimateValueOptions {
  from?: number;
  to?: number;
  duration?: number;
  ease?: (t: number) => number;
  onUpdate?: (value: number) => void;
  onDone?: () => void;
}

export interface AnimateValueHandle {
  cancel(): void;
}

export interface MotionKitAPI {
  readonly version: string;
  readonly reduced: boolean;
  readonly finePointer: boolean;

  init(root?: Element | Document): MotionKitAPI;
  destroy(): MotionKitAPI;

  stream(el: Element, text: string, opts?: StreamOptions): Promise<void>;
  haptic(kind?: HapticKind): void;
  toast(message: string, opts?: ToastOptions): void;
  bump(el: Element, delta?: number): void;

  capture(el: Element): Rect;
  flip(first: Element | Rect, lastEl: Element, opts?: FlipOptions): Animation | null;
  animateValue(opts: AnimateValueOptions): AnimateValueHandle;
}

export declare const MotionKit: MotionKitAPI;
export default MotionKit;
