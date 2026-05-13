import type { BlockData } from '../types';

export function cloneBlockData(data: BlockData): BlockData {
  return {
    positions: data.positions.slice(),
    heights: data.heights.slice(),
    baseY: data.baseY.slice(),
    types: data.types.slice(),
    gridSize: data.gridSize,
    numBlocks: data.numBlocks,
  };
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Each block animates over this fraction of total transition time.
 * Lower = snappier individual pops, more visible ripple wave.
 */
const STAGGER_OVERLAP = 0.35;

/** Bottom-to-top cascade within a single cell stack. */
const LAYER_STAGGER = 0.012;

export function bucketByCell(data: BlockData): Map<string, number[]> {
  const m = new Map<string, number[]>();
  const n = data.numBlocks;
  for (let i = 0; i < n; i++) {
    const col = data.positions[i * 4];
    const row = data.positions[i * 4 + 1];
    const key = `${col},${row}`;
    let arr = m.get(key);
    if (!arr) {
      arr = [];
      m.set(key, arr);
    }
    arr.push(i);
  }
  for (const arr of m.values()) {
    arr.sort((ia, ib) => data.baseY[ia] - data.baseY[ib]);
  }
  return m;
}

/**
 * Staggered ripple morph between two QR block sets.
 *
 * Blocks near the grid center transition first, rippling outward so
 * each block pops in/out individually — reads as "blocks being added
 * and removed" rather than a uniform crossfade.
 *
 * `tLinear` is 0→1 linear time from the renderer; all easing is internal.
 */
export function buildInterpolatedBlockData(
  from: BlockData,
  to: BlockData,
  tLinear: number,
): BlockData {
  const tt = clamp01(tLinear);
  const gridSize = Math.max(from.gridSize, to.gridSize);
  const cx = gridSize / 2;
  const cy = gridSize / 2;

  const oldB = bucketByCell(from);
  const newB = bucketByCell(to);

  const allKeys = new Set<string>();
  for (const k of oldB.keys()) allKeys.add(k);
  for (const k of newB.keys()) allKeys.add(k);

  let maxDist = 0;
  const distMap = new Map<string, number>();
  for (const key of allKeys) {
    const sep = key.indexOf(',');
    const col = +key.slice(0, sep);
    const row = +key.slice(sep + 1);
    const d = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
    distMap.set(key, d);
    if (d > maxDist) maxDist = d;
  }
  if (maxDist < 0.01) maxDist = 1;

  const positions: number[] = [];
  const heights: number[] = [];
  const baseYArr: number[] = [];
  const types: number[] = [];

  for (const key of allKeys) {
    const normDist = distMap.get(key)! / maxDist;
    const cellDelay = normDist * (1 - STAGGER_OVERLAP);

    const oi = oldB.get(key) ?? [];
    const ni = newB.get(key) ?? [];
    const maxStack = Math.max(oi.length, ni.length);

    for (let i = 0; i < maxStack; i++) {
      const delay = Math.min(
        cellDelay + i * LAYER_STAGGER,
        1 - STAGGER_OVERLAP,
      );
      const localT = clamp01((tt - delay) / STAGGER_OVERLAP);

      const o = oi[i];
      const n = ni[i];

      if (o !== undefined && n !== undefined) {
        const col = from.positions[o * 4];
        const row = from.positions[o * 4 + 1];
        const oby = from.baseY[o],
          nby = to.baseY[n];
        const oh = from.heights[o],
          nh = to.heights[n];
        const ot = from.types[o],
          nt = to.types[n];

        if (oh === nh && oby === nby && ot === nt) {
          positions.push(col, row, 0, 0);
          heights.push(oh);
          baseYArr.push(oby);
          types.push(ot);
        } else {
          const u = easeInOutCubic(localT);
          positions.push(col, row, 0, 0);
          heights.push(oh + (nh - oh) * u);
          baseYArr.push(oby + (nby - oby) * u);
          types.push(localT < 0.5 ? ot : nt);
        }
      } else if (o !== undefined) {
        if (localT >= 1) continue;
        const col = from.positions[o * 4];
        const row = from.positions[o * 4 + 1];
        const shrink = 1 - easeInCubic(localT);
        positions.push(col, row, 0, 0);
        heights.push(from.heights[o] * shrink);
        baseYArr.push(from.baseY[o]);
        types.push(from.types[o]);
      } else if (n !== undefined) {
        if (localT <= 0) continue;
        const col = to.positions[n * 4];
        const row = to.positions[n * 4 + 1];
        const grow = easeOutCubic(localT);
        positions.push(col, row, 0, 0);
        heights.push(to.heights[n] * grow);
        baseYArr.push(to.baseY[n]);
        types.push(to.types[n]);
      }
    }
  }

  return {
    positions,
    heights,
    baseY: baseYArr,
    types,
    gridSize,
    numBlocks: types.length,
  };
}
