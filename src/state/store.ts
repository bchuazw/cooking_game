import { create } from 'zustand';
import type { DishId, DishResult, Locale, Stars } from '../types';
import { loadState, saveState, type Persisted } from '../persistence/storage';

interface AppState extends Persisted {
  setLocale: (l: Locale) => void;
  setHalal: (b: boolean) => void;
  setMusic: (v: number) => void;
  setSfx: (v: number) => void;
  setVoice: (v: number) => void;
  setReducedMotion: (b: boolean) => void;
  setDescribeStep: (b: boolean) => void;
  recordDishResult: (r: DishResult) => void;
  markFirstLaunchSeen: () => void;
  markAcceptedNoticeSeen: () => void;
  bestStarFor: (id: DishId) => Stars;
  isUnlocked: (id: DishId) => boolean;
}

const initial = loadState();

// Brief §4 — finishing a dish unlocks the next. Order is the registry order.
const UNLOCK_ORDER: DishId[] = [
  'chicken-rice',
  'laksa',
  'prata',
  'chili-crab',
  'kaya-toast',
];

export const useApp = create<AppState>((set, get) => ({
  ...initial,
  setLocale(l) {
    set({ locale: l });
    saveState({ ...get() });
  },
  setHalal(b) {
    set({ halal: b });
    saveState({ ...get() });
  },
  setMusic(v) {
    set({ music: v });
    saveState({ ...get() });
  },
  setSfx(v) {
    set({ sfx: v });
    saveState({ ...get() });
  },
  setVoice(v) {
    set({ voice: v });
    saveState({ ...get() });
  },
  setReducedMotion(b) {
    set({ reducedMotion: b });
    saveState({ ...get() });
  },
  setDescribeStep(b) {
    set({ describeStep: b });
    saveState({ ...get() });
  },
  recordDishResult(r) {
    const prevBest = get().bestStars[r.dishId] ?? 0;
    const stars = (r.stars > prevBest ? r.stars : prevBest) as Stars;
    const bestStars = { ...get().bestStars, [r.dishId]: stars };
    const results = [...get().results, r].slice(-100);
    const bestCombo = Math.max(get().bestCombo, r.maxCombo ?? 0);
    const dailyDone = r.challengeKey
      ? { ...get().dailyDone, [r.challengeKey]: true as const }
      : get().dailyDone;
    set({ bestStars, results, bestCombo, dailyDone });
    saveState({ ...get() });
  },
  markFirstLaunchSeen() {
    set({ firstLaunchSeen: true });
    saveState({ ...get() });
  },
  markAcceptedNoticeSeen() {
    set({ acceptedNoticeSeen: true });
    saveState({ ...get() });
  },
  bestStarFor(id) {
    return (get().bestStars[id] ?? 0) as Stars;
  },
  isUnlocked(id) {
    const idx = UNLOCK_ORDER.indexOf(id);
    if (idx <= 0) return true;
    const prev = UNLOCK_ORDER[idx - 1];
    return (get().bestStars[prev] ?? 0) > 0;
  },
}));

export { UNLOCK_ORDER };
