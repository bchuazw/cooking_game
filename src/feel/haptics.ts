// Haptic feedback helper. navigator.vibrate is widely available on Android
// browsers and ignored on iOS Safari. We wrap it so reduced-motion / no-vibrate
// devices fall through silently.

import { useApp } from '../state/store';

export function haptic(pattern: number | number[]) {
  if (useApp.getState().reducedMotion) return;
  if (typeof navigator === 'undefined') return;
  // navigator.vibrate signatures vary by lib version; route through any.
  const nav = navigator as unknown as { vibrate?: (...args: unknown[]) => boolean };
  if (typeof nav.vibrate === 'function') {
    try { nav.vibrate(pattern); } catch { /* */ }
  }
}

export const haptics = {
  tap: () => haptic(8),
  snap: () => haptic([12, 30, 12]),
  success: () => haptic([20, 40, 20, 40, 60]),
  error: () => haptic([30, 30, 30]),
  star: (tier: 1 | 2 | 3) => haptic(tier === 3 ? [40, 40, 40, 40, 80] : tier === 2 ? [30, 30, 60] : [40]),
};
