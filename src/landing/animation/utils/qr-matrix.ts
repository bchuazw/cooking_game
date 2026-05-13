import QRCode from 'qrcode';

import { DEFAULT_QR_CONTENT } from '../constants';

function matrixFromModules(modules: {
  size: number;
  get(x: number, y: number): number;
}): boolean[][] {
  const { size } = modules;
  const matrix: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      row.push(modules.get(x, y) === 1);
    }
    matrix.push(row);
  }
  return matrix;
}

export type TryQrMatrixOk = {
  ok: true;
  matrix: boolean[][];
  normalizedContent: string;
};
export type TryQrMatrixErr = { ok: false; error: string };
export type TryQrMatrixResult = TryQrMatrixOk | TryQrMatrixErr;

/**
 * Builds a QR module matrix or returns why the payload is invalid for the qrcode library.
 */
export function tryGenerateQRMatrix(content: string): TryQrMatrixResult {
  const normalized = content.trim() || DEFAULT_QR_CONTENT;
  try {
    const qrCodeData = QRCode.create(normalized, {
      errorCorrectionLevel: 'M',
    });
    const matrix = matrixFromModules(qrCodeData.modules);
    return { ok: true, matrix, normalizedContent: normalized };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : typeof e === 'string' ? e : 'Invalid QR content';
    return { ok: false, error: msg };
  }
}

/**
 * Generates a 2D boolean matrix from QR code content.
 * Falls back to {@link DEFAULT_QR_CONTENT} if the library rejects the string.
 */
export function generateQRMatrix(content: string): boolean[][] {
  const r = tryGenerateQRMatrix(content);
  if (r.ok) return r.matrix;
  const d = tryGenerateQRMatrix(DEFAULT_QR_CONTENT);
  if (!d.ok) {
    throw new Error(`Default QR failed: ${d.error}`);
  }
  return d.matrix;
}
