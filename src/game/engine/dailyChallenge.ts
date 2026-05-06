// Daily seeded challenge — one per UTC day. Deterministic dish + modifier.

import type { DishId } from '../../types';

const DISHES: DishId[] = ['chicken-rice', 'laksa', 'prata', 'chili-crab', 'kaya-toast'];
export const MODIFIERS = ['speed', 'no-hints', 'silent-auntie', 'tight-windows'] as const;
export type Modifier = (typeof MODIFIERS)[number];

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `daily-${y}-${m}-${day}`;
}

export interface DailyPick {
  key: string;
  dish: DishId;
  modifier: Modifier;
}

export function pickDaily(d: Date = new Date()): DailyPick {
  const key = todayKey(d);
  const h = hash32(key);
  return {
    key,
    dish: DISHES[h % DISHES.length],
    modifier: MODIFIERS[(h >>> 8) % MODIFIERS.length],
  };
}
