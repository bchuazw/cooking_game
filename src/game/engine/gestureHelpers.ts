// Pointer / touch helpers shared by gesture surfaces.

import { useEffect, useRef } from 'react';

export interface PointerEvtLike {
  x: number;
  y: number;
  id: number;
  type: 'down' | 'move' | 'up' | 'cancel';
  raw: PointerEvent;
}

export function usePointer(
  ref: React.RefObject<HTMLElement | SVGElement | null>,
  handler: (e: PointerEvtLike) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rectOf = () => (el as HTMLElement).getBoundingClientRect();

    const dispatch = (raw: PointerEvent, type: PointerEvtLike['type']) => {
      const r = rectOf();
      handlerRef.current({
        x: raw.clientX - r.left,
        y: raw.clientY - r.top,
        id: raw.pointerId,
        type,
        raw,
      });
    };

    const down = (e: PointerEvent) => {
      (el as HTMLElement).setPointerCapture?.(e.pointerId);
      dispatch(e, 'down');
    };
    const move = (e: PointerEvent) => dispatch(e, 'move');
    const up = (e: PointerEvent) => dispatch(e, 'up');
    const cancel = (e: PointerEvent) => dispatch(e, 'cancel');

    (el as HTMLElement).addEventListener('pointerdown', down);
    (el as HTMLElement).addEventListener('pointermove', move);
    (el as HTMLElement).addEventListener('pointerup', up);
    (el as HTMLElement).addEventListener('pointercancel', cancel);
    return () => {
      (el as HTMLElement).removeEventListener('pointerdown', down);
      (el as HTMLElement).removeEventListener('pointermove', move);
      (el as HTMLElement).removeEventListener('pointerup', up);
      (el as HTMLElement).removeEventListener('pointercancel', cancel);
    };
  }, [ref]);
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

// Convert client (page) pointer coords to a SVG element's viewBox-local coords.
// Used by interactive steps so positions match what the user actually touched
// regardless of container size / preserveAspectRatio scaling.
export function clientToSvg(svg: SVGSVGElement | null, clientX: number, clientY: number): { x: number; y: number } {
  if (!svg) return { x: clientX, y: clientY };
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const out = pt.matrixTransform(ctm.inverse());
  return { x: out.x, y: out.y };
}

// Convert client point to a canvas element's drawing-surface coords (handles
// the difference between cv.width/height and the displayed cv.clientWidth/Height).
export function clientToCanvas(cv: HTMLCanvasElement | null, clientX: number, clientY: number): { x: number; y: number } {
  if (!cv) return { x: clientX, y: clientY };
  const r = cv.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return { x: 0, y: 0 };
  return {
    x: ((clientX - r.left) / r.width) * cv.width,
    y: ((clientY - r.top) / r.height) * cv.height,
  };
}
