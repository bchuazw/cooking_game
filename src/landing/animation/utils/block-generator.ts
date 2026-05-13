import {
  CANOPY_OUTER_RADIUS_FACTOR,
  CUBE_HEIGHT,
  MAX_CANOPY_LAYERS,
  TRUNK_LAYERS,
  TRUNK_RADIUS,
} from '../constants';
import { BlockData, ReefBlockType, TreeBlockType } from '../types';

function pseudoRandom(col: number, row: number, seed: number = 0): number {
  const s = Math.sin(col * 127.1 + row * 311.7 + seed * 43.7) * 43758.5;
  return s - Math.floor(s);
}

/** Orthogonal dark neighbors — used to break up solid QR “black” masses. */
function darkNeighborCount(qr: boolean[][], col: number, row: number): number {
  const g = qr.length;
  let n = 0;
  if (col > 0 && qr[row][col - 1]) n++;
  if (col < g - 1 && qr[row][col + 1]) n++;
  if (row > 0 && qr[row - 1][col]) n++;
  if (row < g - 1 && qr[row + 1][col]) n++;
  return n;
}

/** Minecraft-inspired silhouettes: tube, brain, fire, bubble. */
function coralForm(col: number, row: number): number {
  return Math.floor(pseudoRandom(col, row, 555) * 4);
}

/** Large-scale palette patch so nearby stacks share similar coral types (less QR “noise”). */
function reefPatchFamily(col: number, row: number): number {
  const pc = Math.floor(col / 6);
  const pr = Math.floor(row / 6);
  return Math.floor(pseudoRandom(pc, pr, 404) * 3);
}

/**
 * Taller spires on edges of dark regions; shallow nubs in dense interiors.
 * Caps kept modest so the reef reads as low mounds, not random skyscrapers.
 */
function coralLayers(
  col: number,
  row: number,
  qrMatrix: boolean[][],
  form: number,
): number {
  const r = pseudoRandom(col, row, 900);
  const nn = darkNeighborCount(qrMatrix, col, row);
  let base: number;
  if (nn >= 3) {
    base = 1 + Math.floor(r * 2);
  } else if (nn <= 1) {
    base = 2 + Math.floor(r * 3);
  } else {
    base = 1 + Math.floor(r * 2);
  }

  if (form === 0) {
    if (nn <= 1) base = Math.min(base + 1, 5);
    else base = Math.min(base + 1, 4);
  } else if (form === 1) {
    base = Math.max(1, Math.min(base, 3 + (nn <= 1 ? 1 : 0)));
  } else if (form === 2) {
    if (nn <= 1) base = Math.min(base + 1, 5);
  } else {
    base = Math.max(1, Math.min(base, 2 + (nn <= 1 ? 1 : 0)));
  }

  return Math.max(1, Math.min(5, base));
}

/**
 * Blur layer counts among orthogonal dark neighbors so adjacent QR cells form
 * rolling “reef mounds” instead of unrelated pillar heights.
 */
function smoothDarkLayerTargets(
  gridSize: number,
  qrMatrix: boolean[][],
  raw: number[][],
  blend: number,
): number[][] {
  const out: number[][] = [];
  for (let row = 0; row < gridSize; row++) {
    out[row] = [];
    for (let col = 0; col < gridSize; col++) {
      if (!qrMatrix[row][col]) {
        out[row][col] = 0;
        continue;
      }
      let sum = raw[row][col];
      let n = 1;
      if (col > 0 && qrMatrix[row][col - 1]) {
        sum += raw[row][col - 1];
        n++;
      }
      if (col < gridSize - 1 && qrMatrix[row][col + 1]) {
        sum += raw[row][col + 1];
        n++;
      }
      if (row > 0 && qrMatrix[row - 1][col]) {
        sum += raw[row - 1][col];
        n++;
      }
      if (row < gridSize - 1 && qrMatrix[row + 1][col]) {
        sum += raw[row + 1][col];
        n++;
      }
      const avg = sum / n;
      const merged = raw[row][col] * (1 - blend) + avg * blend;
      out[row][col] = Math.max(1, Math.min(5, Math.round(merged)));
    }
  }
  return out;
}

function layerHeightScale(
  col: number,
  row: number,
  layer: number,
  maxLayer: number,
  form: number,
): number {
  const r = pseudoRandom(col, row, layer * 19 + 400);
  if (maxLayer <= 1) {
    return 0.92 + r * 0.12;
  }
  if (layer === maxLayer - 1) {
    if (form === 1) return 0.62 + r * 0.18;
    if (form === 3) return 0.55 + r * 0.2;
    return 0.48 + r * 0.22;
  }
  if (layer === 0) {
    return 0.95 + r * 0.08;
  }
  if (form === 0) {
    return 0.5 + r * 0.22;
  }
  if (form === 1) {
    return 0.88 + r * 0.12;
  }
  if (form === 3) {
    return 0.82 + r * 0.14;
  }
  return 0.78 + r * 0.18;
}

function coralTypeForLayer(
  col: number,
  row: number,
  layer: number,
  maxLayer: number,
  family: number,
): ReefBlockType {
  const r = pseudoRandom(col, row, layer * 131 + 17 + family * 97);
  if (layer === 0) {
    return r < 0.78 ? ReefBlockType.Rock : ReefBlockType.CoralMain;
  }

  if (family === 0) {
    if (layer === maxLayer - 1) {
      return r < 0.58 ? ReefBlockType.CoralAccent : ReefBlockType.CoralMain;
    }
    if (r < 0.62) return ReefBlockType.CoralMain;
    if (r < 0.88) return ReefBlockType.CoralAccent;
    return ReefBlockType.CoralBranch;
  }

  if (family === 1) {
    if (layer === maxLayer - 1) {
      return r < 0.62 ? ReefBlockType.CoralAccent : ReefBlockType.CoralBranch;
    }
    if (r < 0.45) return ReefBlockType.CoralMain;
    if (r < 0.82) return ReefBlockType.CoralAccent;
    return ReefBlockType.CoralBranch;
  }

  if (layer === maxLayer - 1) {
    return r < 0.55 ? ReefBlockType.CoralBranch : ReefBlockType.CoralAccent;
  }
  if (r < 0.4) return ReefBlockType.CoralMain;
  if (r < 0.72) return ReefBlockType.CoralBranch;
  return ReefBlockType.CoralAccent;
}

/**
 * QR → seabed: sand plane; dark modules = varied coral/rock stacks (tapered).
 */
export function generateReefBlockData(qrMatrix: boolean[][]): BlockData {
  const gridSize = qrMatrix.length;

  const rawTargets: number[][] = [];
  for (let row = 0; row < gridSize; row++) {
    rawTargets[row] = [];
    for (let col = 0; col < gridSize; col++) {
      if (!qrMatrix[row][col]) {
        rawTargets[row][col] = 0;
      } else {
        const form = coralForm(col, row);
        rawTargets[row][col] = coralLayers(col, row, qrMatrix, form);
      }
    }
  }

  const smoothed = smoothDarkLayerTargets(
    gridSize,
    qrMatrix,
    smoothDarkLayerTargets(gridSize, qrMatrix, rawTargets, 0.52),
    0.38,
  );

  const positions: number[] = [];
  const heights: number[] = [];
  const baseY: number[] = [];
  const types: number[] = [];

  let blockCount = 0;

  function push(
    col: number,
    row: number,
    h: number,
    by: number,
    type: ReefBlockType,
  ) {
    positions.push(col, row, 0, 0);
    heights.push(h);
    baseY.push(by);
    types.push(type);
    blockCount++;
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isDark = qrMatrix[row][col];
      if (!isDark) {
        const sandBump = 1.0 + pseudoRandom(col, row, 777) * 0.04;
        push(col, row, CUBE_HEIGHT * sandBump, 0, ReefBlockType.Sand);
        continue;
      }

      const form = coralForm(col, row);
      const family = reefPatchFamily(col, row);
      const layers = smoothed[row][col];
      let yCursor = 0;
      for (let layer = 0; layer < layers; layer++) {
        const hScale = layerHeightScale(col, row, layer, layers, form);
        const h = CUBE_HEIGHT * hScale;
        push(
          col,
          row,
          h,
          yCursor,
          coralTypeForLayer(col, row, layer, layers, family),
        );
        yCursor += h;
      }
    }
  }

  return {
    positions,
    heights,
    baseY,
    types,
    gridSize,
    numBlocks: blockCount,
  };
}

/**
 * Cherry blossom tree QR — original voxel tree layout.
 */
export function generateTreeBlockData(qrMatrix: boolean[][]): BlockData {
  const gridSize = qrMatrix.length;
  const cx = gridSize / 2;
  const cy = gridSize / 2;

  const positions: number[] = [];
  const heights: number[] = [];
  const baseY: number[] = [];
  const types: number[] = [];

  const canopyBaseHeight = TRUNK_LAYERS * CUBE_HEIGHT;
  const canopyOuterRadius = gridSize * CANOPY_OUTER_RADIUS_FACTOR;

  let blockCount = 0;

  function push(
    col: number,
    row: number,
    h: number,
    by: number,
    type: TreeBlockType,
  ) {
    positions.push(col, row, 0, 0);
    heights.push(h);
    baseY.push(by);
    types.push(type);
    blockCount++;
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isQrDark = qrMatrix[row][col];
      const dx = col - cx;
      const dy = row - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!isQrDark) {
        push(col, row, CUBE_HEIGHT, 0, TreeBlockType.Dirt);
      } else if (dist < TRUNK_RADIUS) {
        push(col, row, CUBE_HEIGHT, 0, TreeBlockType.Trunk);
      } else if (dist >= canopyOuterRadius) {
        const hVar = 1.0 + pseudoRandom(col, row, 600) * 0.45;
        push(col, row, CUBE_HEIGHT * hVar, 0, TreeBlockType.Grass);
      } else {
        const hVar = 1.0 + pseudoRandom(col, row, 610) * 0.2;
        push(col, row, CUBE_HEIGHT * hVar, 0, TreeBlockType.FallenPetals);
      }
    }
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isQrDark = qrMatrix[row][col];
      if (!isQrDark) continue;

      const dx = col - cx;
      const dy = row - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < TRUNK_RADIUS) {
        for (let layer = 1; layer < TRUNK_LAYERS; layer++) {
          push(col, row, CUBE_HEIGHT, layer * CUBE_HEIGHT, TreeBlockType.Trunk);
        }
      }
    }
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isQrDark = qrMatrix[row][col];
      if (!isQrDark) continue;

      const dx = col - cx;
      const dy = row - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < canopyOuterRadius) {
        const t = 1 - dist / canopyOuterRadius;
        const layersHere = Math.max(
          3,
          Math.round(MAX_CANOPY_LAYERS * (0.25 + 0.75 * t * t)),
        );

        for (let layer = 0; layer < layersHere; layer++) {
          const layerY = canopyBaseHeight + layer * CUBE_HEIGHT;
          const domeOffset = Math.floor(t * 3) * CUBE_HEIGHT;
          push(
            col,
            row,
            CUBE_HEIGHT,
            layerY + domeOffset,
            TreeBlockType.CherryBlossom,
          );
        }

        const extraCount = Math.floor(pseudoRandom(col, row, 500) * 4);
        for (let e = 0; e < extraCount; e++) {
          const extraLayer = layersHere + e;
          const domeOffset = Math.floor(t * 3) * CUBE_HEIGHT;
          push(
            col,
            row,
            CUBE_HEIGHT,
            canopyBaseHeight + extraLayer * CUBE_HEIGHT + domeOffset,
            TreeBlockType.CherryBlossom,
          );
        }
      }
    }
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isQrDark = qrMatrix[row][col];
      if (!isQrDark) continue;

      const dx = col - cx;
      const dy = row - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= canopyOuterRadius) {
        if (pseudoRandom(col, row, 700) < 0.28) {
          const groundH =
            CUBE_HEIGHT * (1.0 + pseudoRandom(col, row, 600) * 0.45);
          const tuftH =
            CUBE_HEIGHT * (0.2 + pseudoRandom(col, row, 701) * 0.45);
          push(col, row, tuftH, groundH, TreeBlockType.Grass);

          if (pseudoRandom(col, row, 702) < 0.3) {
            const tuftH2 =
              CUBE_HEIGHT * (0.12 + pseudoRandom(col, row, 703) * 0.28);
            push(col, row, tuftH2, groundH + tuftH, TreeBlockType.Grass);
          }
        }
      } else if (dist >= TRUNK_RADIUS) {
        if (pseudoRandom(col, row, 800) < 0.18) {
          const groundH =
            CUBE_HEIGHT * (1.0 + pseudoRandom(col, row, 610) * 0.2);
          const petalH =
            CUBE_HEIGHT * (0.15 + pseudoRandom(col, row, 801) * 0.3);
          push(col, row, petalH, groundH, TreeBlockType.CherryBlossom);
        }
      }
    }
  }

  return {
    positions,
    heights,
    baseY,
    types,
    gridSize,
    numBlocks: blockCount,
  };
}
