import type { HeldItem, StationItem, PlateComponent, StationId, StationDefinition, CollisionBox } from '../gameData';
import type { Locale } from '../i18n/types';

export type DishId = 'chicken-rice';

export interface DishStrings {
  name: string;
  shortName: string;
  goal: string;
  itemLabels: Partial<Record<HeldItem | StationItem, string>>;
  plateLabels: Record<PlateComponent, string>;
  workflowLabels: Record<PlateComponent | 'plate' | 'serve', string>;
  stationTips: Partial<Record<StationId, { title: string; body: string }>>;
  startFeedback: string;
}

export interface DishPalette {
  wall: string;
  wallDark: string;
  floor: string;
  tileLine: string;
  counter: string;
  counterTop: string;
  counterDark: string;
  accentTop: string;
  accentBottom: string;
  pendantWarm: string;
  pendantRing: string;
}

export interface DishTimers {
  chopChicken: number;
  poundSauce: number;
  riceCook: number;
  riceOvercook: number;
  chickenPoach: number;
  chickenOvercook: number;
}

export interface DishConfig {
  id: DishId;
  strings: Record<Locale, DishStrings>;
  palette: DishPalette;
  stations: StationDefinition[];
  collisionBoxes: CollisionBox[];
  timers: DishTimers;
  /** Where the cook spawns at the start of a shift. Must sit OUTSIDE every collisionBox. */
  startPos: { x: number; z: number };
}
