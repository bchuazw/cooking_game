// localStorage wrapper with schema versioning. Brief §6 calls for Dexie/IndexedDB;
// see DECISIONS.md for substitution rationale (data is < 4 KB).

import type { DishId, DishResult, Locale, Stars } from '../types';

const KEY = 'hawker-mama:v1';

interface Persisted {
  schema: 1;
  locale: Locale;
  halal: boolean;
  music: number; // 0..1
  sfx: number; // 0..1
  voice: number; // 0..1
  reducedMotion: boolean;
  describeStep: boolean;
  bestStars: Partial<Record<DishId, Stars>>;
  results: DishResult[]; // local leaderboard
  firstLaunchSeen: boolean;
  acceptedNoticeSeen: boolean;
  dailyDone: Record<string, true>; // challengeKey -> done
  bestCombo: number;
}

const DEFAULTS: Persisted = {
  schema: 1,
  locale: 'ja',
  halal: false,
  music: 0.6,
  sfx: 0.8,
  voice: 0.7,
  reducedMotion: false,
  describeStep: false,
  bestStars: {},
  results: [],
  firstLaunchSeen: false,
  acceptedNoticeSeen: false,
  dailyDone: {},
  bestCombo: 0,
};

export function loadState(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    if (parsed.schema !== 1) return { ...DEFAULTS };
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveState(s: Persisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Quota / private mode — silently degrade.
  }
}

export type { Persisted };
