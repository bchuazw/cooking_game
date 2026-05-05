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
