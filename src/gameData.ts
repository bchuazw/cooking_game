export type StepKind = 'prep' | 'stir' | 'simmer' | 'mash' | 'plate';
export type Tier = 'gold' | 'silver' | 'bronze';

export interface StepDefinition {
  id: string;
  kind: StepKind;
  title: string;
  shortTitle: string;
  instruction: string;
  lesson: string;
  target: number;
}

export interface DishDefinition {
  id: 'chicken-rice';
  name: string;
  shortName: string;
  tagline: string;
  learning: string;
  steps: StepDefinition[];
}

export const CHICKEN_RICE: DishDefinition = {
  id: 'chicken-rice',
  name: 'Hainanese Chicken Rice',
  shortName: 'Chicken Rice',
  tagline: 'Prep aromatics, cook fragrant rice, poach chicken, make chili, then plate the hawker classic.',
  learning:
    'Singapore-style chicken rice is built from gentle poached chicken, rice cooked with chicken fat and aromatics, clear stock, cucumber, and chili-ginger sauce.',
  steps: [
    {
      id: 'prep-aromatics',
      kind: 'prep',
      title: 'Prep the Aromatics',
      shortTitle: 'Prep',
      instruction: 'Tap the timing bar or Chop button when the cleaver is centered over the ingredient.',
      lesson: 'Garlic, ginger, pandan, and shallot perfume both the broth and the chicken-fat rice.',
      target: 4,
    },
    {
      id: 'toast-rice',
      kind: 'stir',
      title: 'Toast the Rice',
      shortTitle: 'Rice',
      instruction: 'Pull upward into the gold band, then release to toss rice with aromatics and chicken fat.',
      lesson: 'Toasting rice in fat and aromatics before cooking gives chicken rice its signature fragrance.',
      target: 3,
    },
    {
      id: 'poach-chicken',
      kind: 'simmer',
      title: 'Poach the Chicken',
      shortTitle: 'Poach',
      instruction: 'Drag the heat handle into the green target band, then draw circles on the stock to stir gently.',
      lesson: 'Chicken rice uses gentle poaching, not a hard boil, so the meat stays silky.',
      target: 3,
    },
    {
      id: 'make-chili',
      kind: 'mash',
      title: 'Make the Chili Sauce',
      shortTitle: 'Sauce',
      instruction: 'Tap chili, ginger, garlic, and lime into the mortar, then pull the pestle down and release.',
      lesson: 'A bright chili-ginger sauce balances the rich rice and tender chicken.',
      target: 4,
    },
    {
      id: 'plate-set',
      kind: 'plate',
      title: 'Plate the Set',
      shortTitle: 'Plate',
      instruction: 'Drag or tap rice, chicken, cucumber, and chili onto the plate in any order.',
      lesson: 'A classic plate needs fragrant rice, sliced chicken, cucumber, chili, and often a bowl of broth.',
      target: 4,
    },
  ],
};

export function tierFromScore(score: number): Tier {
  if (score >= 0.86) return 'gold';
  if (score >= 0.64) return 'silver';
  return 'bronze';
}

export function starsFromAverage(score: number): 1 | 2 | 3 {
  if (score >= 0.86) return 3;
  if (score >= 0.64) return 2;
  return 1;
}
