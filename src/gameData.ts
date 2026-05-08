export type DishId = 'chicken-rice' | 'laksa' | 'prata';
export type StepKind = 'cut' | 'slider' | 'sequence' | 'stir' | 'hold' | 'swipe' | 'fold' | 'plate';
export type Tier = 'gold' | 'silver' | 'bronze';

export interface StepDefinition {
  id: string;
  kind: StepKind;
  title: string;
  instruction: string;
  targetLabel: string;
  items?: { id: string; label: string; color: string }[];
  target?: { min: number; max: number; unit: string };
  seconds?: number;
  swipes?: number;
  turns?: number;
}

export interface DishDefinition {
  id: DishId;
  name: string;
  shortName: string;
  tagline: string;
  learning: string;
  palette: {
    main: string;
    dark: string;
    light: string;
  };
  steps: StepDefinition[];
}

export const DISHES: DishDefinition[] = [
  {
    id: 'chicken-rice',
    name: 'Hainanese Chicken Rice',
    shortName: 'Chicken Rice',
    tagline: 'Poach the chicken, season fragrant rice, chop, and plate the hawker classic.',
    learning:
      'Chicken rice came with Hainanese migrants and became Singaporean through chicken-fat rice, clear stock, and ginger-chili sauce.',
    palette: { main: '#2BA59D', dark: '#174F55', light: '#BDEFE8' },
    steps: [
      {
        id: 'poach',
        kind: 'slider',
        title: 'Poach the Chicken',
        instruction: 'Drag the thermometer into the green zone, then tap the chicken once to turn it.',
        targetLabel: 'Poach heat',
        target: { min: 76, max: 84, unit: 'C' },
      },
      {
        id: 'aromatics',
        kind: 'sequence',
        title: 'Season the Rice',
        instruction: 'Tap the wok to toss each aromatic in order, or drag them in.',
        targetLabel: 'Next ingredient',
        items: [
          { id: 'shallot', label: 'Shallot', color: '#B34779' },
          { id: 'garlic', label: 'Garlic', color: '#E7C650' },
          { id: 'ginger', label: 'Ginger', color: '#D88938' },
          { id: 'pandan', label: 'Pandan', color: '#5FA54B' },
        ],
      },
      {
        id: 'cut',
        kind: 'cut',
        title: 'Chop the Cooked Chicken',
        instruction: 'Tap CHOP as the cleaver lines up with each cooked serving cut.',
        targetLabel: 'Clean cleaver cuts',
        items: [
          { id: 'left-wing', label: 'Wing portion', color: '#D69A62' },
          { id: 'left-drumlet', label: 'Left leg portion', color: '#C9834C' },
          { id: 'right-drumlet', label: 'Right leg portion', color: '#C9834C' },
          { id: 'right-wing', label: 'Final wing portion', color: '#D69A62' },
        ],
      },
      {
        id: 'plate',
        kind: 'plate',
        title: 'Plate the Set',
        instruction: 'Tap or drag each part onto the plate.',
        targetLabel: 'Plate',
        items: [
          { id: 'rice', label: 'Rice', color: '#F8F0D7' },
          { id: 'chicken', label: 'Chicken', color: '#D69A62' },
          { id: 'sauce', label: 'Chili Sauce', color: '#D8432B' },
        ],
      },
    ],
  },
  {
    id: 'laksa',
    name: 'Katong Laksa',
    shortName: 'Laksa',
    tagline: 'Bloom rempah, build coconut broth, and blanch the noodles just right.',
    learning:
      'Katong laksa is Peranakan-style: coconut broth, dried-shrimp rempah, short rice noodles, and a spoon-first eating style.',
    palette: { main: '#D8432B', dark: '#7F2C20', light: '#FFC2A2' },
    steps: [
      {
        id: 'rempah',
        kind: 'stir',
        title: 'Bloom the Rempah',
        instruction: 'Stir circles or tap the pan to flip the paste.',
        targetLabel: 'Circle stir',
        turns: 3,
      },
      {
        id: 'broth',
        kind: 'sequence',
        title: 'Build the Broth',
        instruction: 'Tap the pot to toss each broth ingredient in order.',
        targetLabel: 'Next pour',
        items: [
          { id: 'stock', label: 'Stock', color: '#7DB7E8' },
          { id: 'coconut', label: 'Coconut', color: '#FFF3DC' },
          { id: 'tau-pok', label: 'Tau Pok', color: '#D6A54B' },
        ],
      },
      {
        id: 'noodles',
        kind: 'hold',
        title: 'Blanch Noodles',
        instruction: 'Hold to blanch, tap the basket to dunk, release in the window.',
        targetLabel: 'Release window',
        target: { min: 2.4, max: 3.7, unit: 's' },
        seconds: 4.5,
      },
    ],
  },
  {
    id: 'prata',
    name: 'Roti Prata',
    shortName: 'Prata',
    tagline: 'Knead, slap-stretch, fold, then serve flaky layers with curry.',
    learning:
      'Roti prata grew from South Indian flatbread traditions into a Singapore hawker staple, usually eaten with curry.',
    palette: { main: '#E8B83A', dark: '#7C4A1D', light: '#FFE7A8' },
    steps: [
      {
        id: 'knead',
        kind: 'stir',
        title: 'Knead the Dough',
        instruction: 'Rub circles or tap the dough to slap-knead it.',
        targetLabel: 'Knead circles',
        turns: 2,
      },
      {
        id: 'stretch',
        kind: 'swipe',
        title: 'Slap-Stretch',
        instruction: 'Swipe left and right; tap the dough for a slap bounce.',
        targetLabel: 'Stretch count',
        swipes: 6,
      },
      {
        id: 'fold',
        kind: 'fold',
        title: 'Fold the Prata',
        instruction: 'Drag all four corner flaps into the centre, tap to settle.',
        targetLabel: 'Fold corners',
      },
    ],
  },
];

export const dishById = (id: DishId) => DISHES.find((dish) => dish.id === id) ?? DISHES[0];

export function tierFromScore(score: number): Tier {
  if (score >= 0.86) return 'gold';
  if (score >= 0.62) return 'silver';
  return 'bronze';
}

export function starsFromAverage(score: number): 1 | 2 | 3 {
  if (score >= 0.86) return 3;
  if (score >= 0.62) return 2;
  return 1;
}
