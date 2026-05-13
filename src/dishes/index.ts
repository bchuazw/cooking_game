import { chickenRice } from './chicken-rice';
import type { DishConfig, DishId } from './types';

export const DISHES: Record<DishId, DishConfig> = {
  'chicken-rice': chickenRice,
};

export const DISH_ORDER: DishId[] = ['chicken-rice'];

export function getDish(id: DishId): DishConfig {
  return DISHES[id];
}

export type { DishConfig, DishId };
