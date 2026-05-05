// Shared types across the game.

export type Locale = 'ja' | 'en';

export type DishId =
  | 'chicken-rice'
  | 'laksa'
  | 'prata'
  | 'chili-crab'
  | 'kaya-toast';

export type Stars = 0 | 1 | 2 | 3;

export type ScoreTier = 'bronze' | 'silver' | 'gold' | 'miss';

export interface StepResult {
  stepId: string;
  tier: ScoreTier;
  rawScore: number; // 0..1
  durationMs: number;
}

export interface DishResult {
  dishId: DishId;
  stars: Stars;
  steps: StepResult[];
  totalScore: number;
  completedAt: number; // epoch ms
}

export interface DishSpec {
  id: DishId;
  // Localized titles & blurbs are in i18n; here we only carry IDs/structural data.
  steps: StepSpec[];
  unlockOrder: number;
  halalCompatible: boolean;
}

export interface StepSpec {
  id: string;
  // These ids drive React routing within the dish runner.
  // Each step renders via a dish-specific React component.
  durationMs?: number;
}

export type AuntieMood =
  | 'idle'
  | 'cheering'
  | 'worried'
  | 'tasting'
  | 'dish_burned'
  | 'dish_perfect'
  | 'culture_card'
  | 'tutorial_pointing';
