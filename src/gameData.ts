export type StationId =
  | 'fridge'
  | 'pantry'
  | 'board'
  | 'riceCooker'
  | 'pot'
  | 'mortar'
  | 'plate'
  | 'serve'
  | 'trash';

export type HeldItem =
  | 'rawRice'
  | 'cookedRice'
  | 'rawChicken'
  | 'cutChicken'
  | 'poachedChicken'
  | 'chiliSauce'
  | 'chickenRice';

export type StationItem =
  | 'rawRice'
  | 'cookingRice'
  | 'cookedRice'
  | 'overcookedRice'
  | 'rawChicken'
  | 'cutChicken'
  | 'poachingChicken'
  | 'poachedChicken'
  | 'overcookedChicken'
  | 'chiliIngredients'
  | 'chiliSauce';

export type PlateComponent = 'rice' | 'chicken' | 'sauce';

export interface StationDefinition {
  id: StationId;
  name: string;
  shortName: string;
  x: number;
  z: number;
  uiX: number;
  uiY: number;
}

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const DISH = {
  name: 'Hainanese Chicken Rice',
  shortName: 'Chicken Rice',
  goal: 'Cook rice, poach chicken, pound chili, plate the set, and serve it hot.',
  learning:
    'Hainanese chicken rice is built from fragrant rice, gently poached chicken, and a sharp chili-garlic sauce. Timing matters because the rice and chicken are best served just cooked.',
};

export const STATIONS: StationDefinition[] = [
  { id: 'fridge', name: 'Fridge', shortName: 'Fridge', x: -3.15, z: -1.25, uiX: 18, uiY: 34 },
  { id: 'pantry', name: 'Rice Pantry', shortName: 'Pantry', x: -1.6, z: -2.0, uiX: 34, uiY: 26 },
  { id: 'board', name: 'Cutting Board', shortName: 'Board', x: 0.05, z: -2.0, uiX: 50, uiY: 26 },
  { id: 'riceCooker', name: 'Rice Cooker', shortName: 'Rice', x: 1.75, z: -2.0, uiX: 68, uiY: 26 },
  { id: 'pot', name: 'Stock Pot', shortName: 'Pot', x: 3.35, z: -0.35, uiX: 82, uiY: 45 },
  { id: 'mortar', name: 'Chili Mortar', shortName: 'Sauce', x: -2.4, z: 1.55, uiX: 27, uiY: 67 },
  { id: 'plate', name: 'Plate Station', shortName: 'Plate', x: -0.15, z: 1.38, uiX: 50, uiY: 67 },
  { id: 'serve', name: 'Serve Window', shortName: 'Serve', x: 1.75, z: 1.38, uiX: 70, uiY: 67 },
  { id: 'trash', name: 'Trash Bin', shortName: 'Trash', x: -3.3, z: 0.65, uiX: 15, uiY: 57 },
];

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((station) => [station.id, station])) as Record<StationId, StationDefinition>;

export const ITEM_LABELS: Record<HeldItem | StationItem, string> = {
  rawRice: 'Uncooked rice',
  cookingRice: 'Cooking rice',
  cookedRice: 'Fragrant rice',
  overcookedRice: 'Dry rice',
  rawChicken: 'Raw chicken',
  cutChicken: 'Cut chicken',
  poachingChicken: 'Poaching chicken',
  poachedChicken: 'Poached chicken',
  overcookedChicken: 'Tough chicken',
  chiliIngredients: 'Chili ingredients',
  chiliSauce: 'Chili sauce',
  chickenRice: 'Chicken rice',
};

export const PLATE_LABELS: Record<PlateComponent, string> = {
  rice: 'Rice',
  chicken: 'Chicken',
  sauce: 'Chili',
};

export const TIMERS = {
  chopChicken: 1500,
  poundSauce: 1700,
  riceCook: 5200,
  riceOvercook: 16000,
  chickenPoach: 5600,
  chickenOvercook: 18000,
};

export const WORLD_LIMITS = {
  minX: -3.65,
  maxX: 3.55,
  minZ: -2.25,
  maxZ: 1.65,
};

export const PLAYER_RADIUS = 0.22;

export const COLLISION_BOXES: CollisionBox[] = [
  { minX: -3.35, maxX: 2.85, minZ: -2.52, maxZ: -1.56 },
  { minX: -2.98, maxX: 2.62, minZ: 1.05, maxZ: 1.78 },
  { minX: -3.78, maxX: -3.02, minZ: -1.34, maxZ: 1.36 },
  { minX: 2.92, maxX: 3.72, minZ: -1.04, maxZ: 1.58 },
];
