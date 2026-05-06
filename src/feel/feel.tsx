// Game-feel layer: imperative particles + floating text + screen shake.
// One canvas, one RAF loop, one tiny global state. Components call the
// imperative emitters; the FeelLayer at the App root renders everything.

import { useEffect, useRef } from 'react';
import { useApp } from '../state/store';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string;
  size: number;
  gravity: number;
  fade: number;
}

interface FloatText {
  x: number; y: number;
  vy: number;
  text: string;
  color: string;
  size: number;
  life: number; maxLife: number;
}

interface ShakeState {
  amount: number;
  until: number;
}

const state = {
  particles: [] as Particle[],
  floats: [] as FloatText[],
  shake: { amount: 0, until: 0 } as ShakeState,
};

let wakeRenderer: (() => void) | null = null;

function wake() {
  wakeRenderer?.();
}

export function emitBurst(x: number, y: number, opts: Partial<{ color: string; count: number; speed: number; gravity: number; size: number; life: number; spread: number }> = {}) {
  if (useApp.getState().reducedMotion) return;
  const { color = '#E8B83A', count = 18, speed = 4, gravity = 0.18, size = 4, life = 800, spread = Math.PI * 2 } = opts;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * spread;
    const v = speed * (0.5 + Math.random());
    state.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 1,
      life: life + Math.random() * 200,
      maxLife: life + 200,
      color,
      size: size * (0.7 + Math.random() * 0.6),
      gravity,
      fade: 1,
    });
  }
  wake();
}

export function emitFloat(x: number, y: number, text: string, color = '#E8B83A', size = 24) {
  if (useApp.getState().reducedMotion) return;
  state.floats.push({
    x, y,
    vy: -1.2,
    text,
    color,
    size,
    life: 900,
    maxLife: 900,
  });
  wake();
}

export function shake(amount = 6, duration = 200) {
  if (useApp.getState().reducedMotion) return;
  const now = performance.now();
  state.shake.amount = Math.max(state.shake.amount, amount);
  state.shake.until = Math.max(state.shake.until, now + duration);
  wake();
}

export function FeelLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useApp((s) => s.reducedMotion);

  useEffect(() => {
    const cv = canvasRef.current;
    const container = containerRef.current;
    if (!cv || !container) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    const parent = container.parentElement;

    const resize = () => {
      const r = container.getBoundingClientRect();
      cv.width = Math.floor(r.width * devicePixelRatio);
      cv.height = Math.floor(r.height * devicePixelRatio);
      cv.style.width = `${r.width}px`;
      cv.style.height = `${r.height}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const loop = (now: number) => {
      raf = 0;
      const dt = Math.min(50, now - last);
      last = now;
      const r = container.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);

      // particles
      const dts = dt * 0.06;
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dts;
        p.y += p.vy * dts;
        p.vy += p.gravity * dts;
        p.life -= dt;
        if (p.life <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        const a = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * a), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // floats
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 24px "M PLUS Rounded 1c", "Noto Sans JP", sans-serif';
      for (let i = state.floats.length - 1; i >= 0; i--) {
        const f = state.floats[i];
        f.y += f.vy * dts;
        f.life -= dt;
        if (f.life <= 0) {
          state.floats.splice(i, 1);
          continue;
        }
        const a = Math.max(0, f.life / f.maxLife);
        ctx.globalAlpha = a;
        ctx.font = `700 ${f.size}px "M PLUS Rounded 1c", "Noto Sans JP", sans-serif`;
        // outline
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#3A2D24';
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;

      // shake
      let dx = 0, dy = 0;
      if (state.shake.until > now) {
        const remaining = state.shake.until - now;
        const ratio = Math.min(1, remaining / 200);
        dx = (Math.random() * 2 - 1) * state.shake.amount * ratio;
        dy = (Math.random() * 2 - 1) * state.shake.amount * ratio;
      } else {
        state.shake.amount = 0;
      }
      if (parent) parent.style.transform = dx || dy ? `translate(${dx}px, ${dy}px)` : '';

      if (state.particles.length > 0 || state.floats.length > 0 || state.shake.until > now) {
        raf = requestAnimationFrame(loop);
      }
    };

    const requestLoop = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    wakeRenderer = requestLoop;
    if (state.particles.length > 0 || state.floats.length > 0 || state.shake.until > performance.now()) {
      requestLoop();
    }

    return () => {
      cancelAnimationFrame(raf);
      if (wakeRenderer === requestLoop) wakeRenderer = null;
      ro.disconnect();
      if (parent) parent.style.transform = '';
    };
  }, []);

  if (reduced) return null;
  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-30">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
