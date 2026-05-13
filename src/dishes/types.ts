import type { HeldItem, StationItem, PlateComponent, StationId, StationDefinition, CollisionBox } from '../gameData';
import type { Locale } from '../i18n/types';

export type DishId = 'chicken-rice' | 'laksa';

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

export interface DishConfig {
  id: DishId;
  strings: Record<Locale, DishStrings>;
  palette: DishPalette;
  stations: StationDefinition[];
  collisionBoxes: CollisionBox[];
}
