// Spring hook — second-order critical-damped spring on a scalar value.
// Returns the current animated value; updates a ref each RAF tick.

import { useEffect, useRef, useState } from 'react';

export interface SpringOpts {
  stiffness?: number;
  damping?: number;
  mass?: number;
  precision?: number;
}

export function useSpring(target: number, opts: SpringOpts = {}): number {
  const { stiffness = 220, damping = 22, mass = 1, precision = 0.01 } = opts;
  const [v, setV] = useState(target);
  const valueRef = useRef(target);
  const velRef = useRef(0);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const tgt = targetRef.current;
      const x = valueRef.current;
      const dx = tgt - x;
      const force = stiffness * dx - damping * velRef.current;
      velRef.current += (force / mass) * dt;
      valueRef.current = x + velRef.current * dt;
      if (Math.abs(velRef.current) < precision && Math.abs(dx) < precision) {
        valueRef.current = tgt;
        velRef.current = 0;
        setV(tgt);
        return;
      }
      setV(valueRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stiffness, damping, mass, precision]);

  return v;
}

// Spring on a 2D point — convenience.
export function useSpring2(tx: number, ty: number, opts: SpringOpts = {}): { x: number; y: number } {
  const x = useSpring(tx, opts);
  const y = useSpring(ty, opts);
  return { x, y };
}
