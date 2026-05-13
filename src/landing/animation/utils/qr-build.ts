import type { VisualStyleId } from '../visual-styles';
import type { BlockData } from '../types';

import { generateReefBlockData, generateTreeBlockData } from './block-generator';
import { tryGenerateQRMatrix } from './qr-matrix';

export type TryBuildOk = {
  ok: true;
  data: BlockData;
  normalizedContent: string;
};
export type TryBuildErr = { ok: false; error: string };
export type TryBuildResult = TryBuildOk | TryBuildErr;

/** Validates content and produces block data for the GPU path. */
export function tryBuildBlockData(
  content: string,
  style: VisualStyleId,
): TryBuildResult {
  const r = tryGenerateQRMatrix(content);
  if (!r.ok) return r;
  const data =
    style === 'reef'
      ? generateReefBlockData(r.matrix)
      : generateTreeBlockData(r.matrix);
  return {
    ok: true,
    data,
    normalizedContent: r.normalizedContent,
  };
}
