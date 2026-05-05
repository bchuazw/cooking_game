import type { ScoreTier, Stars, StepResult } from '../../types';

export function tierToScore(tier: ScoreTier): number {
  switch (tier) {
    case 'gold':
      return 1.0;
    case 'silver':
      return 0.7;
    case 'bronze':
      return 0.4;
    case 'miss':
      return 0.0;
  }
}

export function scoreFromBands(value: number, gold: number, silver: number, bronze: number): ScoreTier {
  if (value >= gold) return 'gold';
  if (value >= silver) return 'silver';
  if (value >= bronze) return 'bronze';
  return 'miss';
}

// Aggregate steps to a 1–3 star rating (brief §5).
export function aggregateStars(steps: StepResult[]): Stars {
  if (steps.length === 0) return 0;
  const avg = steps.reduce((a, b) => a + tierToScore(b.tier), 0) / steps.length;
  // Bias toward forgiveness — brief §4 #2.
  if (avg >= 0.85) return 3;
  if (avg >= 0.55) return 2;
  return 1;
}

export function tierColor(tier: ScoreTier): string {
  switch (tier) {
    case 'gold':
      return '#E8B83A';
    case 'silver':
      return '#B0B0B0';
    case 'bronze':
      return '#C58B5A';
    case 'miss':
      return '#7a7a7a';
  }
}
