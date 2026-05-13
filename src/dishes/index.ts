import { chickenRice } from './chicken-rice';
import { laksa } from './laksa';
import type { DishConfig, DishId } from './types';

export const DISHES: Record<DishId, DishConfig> = {
  'chicken-rice': chickenRice,
  laksa,
};

export const DISH_ORDER: DishId[] = ['chicken-rice', 'laksa'];

export function getDish(id: DishId): DishConfig {
  return DISHES[id];
}

export type { DishConfig, DishId };
