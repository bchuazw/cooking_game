export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface BlockData {
  positions: number[];
  heights: number[];
  baseY: number[];
  types: number[];
  gridSize: number;
  numBlocks: number;
}

/** Cherry tree QR (style = tree). */
export enum TreeBlockType {
  Dirt = 0,
  CherryBlossom = 1,
  Trunk = 2,
  Grass = 3,
  FallenPetals = 4,
}

/** Coral reef QR (style = reef). IDs 0–4; same u32 as tree but different WGSL palette. */
export enum ReefBlockType {
  Sand = 0,
  CoralMain = 1,
  CoralAccent = 2,
  Rock = 3,
  CoralBranch = 4,
}
