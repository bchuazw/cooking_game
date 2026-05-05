// Dish 5 — Kaya Toast & Soft-Boiled Eggs (calm closer).
// Signature: hold-to-toast (color cue) + spread coverage with even-spread bonus.

import { useEffect, useRef, useState } from 'react';
import type { DishResult, ScoreTier, StepResult } from '../../../types';
import { DishRunner } from '../../engine/DishRunner';
import { HUD } from '../../engine/HUD';
import { useStep } from '../../engine/useStep';
import { sfx } from '../../../audio/audio';
import { usePointer, clamp } from '../../engine/gestureHelpers';

const DISH = 'kaya-toast';

// Step 1: Toast bread — color is the only cue
function ToastStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const [holding, setHolding] = useState(false);
  const [color, setColor] = useState(0); // 0..1.5 (1=ideal, >1=burnt)
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!holding) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setColor((c) => Math.min(1.6, c + dt * 0.18));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [holding]);

  // Auto-complete after a max time (10s)
  useEffect(() => {
    const id = setTimeout(() => {
      if (!finishedRef.current) finalize();
    }, 10000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalize = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    sfx.toastpop();
    let tier: ScoreTier;
    // gold: 0.85..1.05, silver: 0.6..1.2, bronze: 0.3..1.4
    if (color >= 0.85 && color <= 1.05) tier = 'gold';
    else if (color >= 0.6 && color <= 1.2) tier = 'silver';
    else if (color >= 0.3 && color <= 1.4) tier = 'bronze';
    else tier = 'miss';
    onComplete({ stepId: 'toast', tier, rawScore: 1 - Math.abs(color - 0.95), durationMs: 0 });
  };

  // Visual: bread color shifts from cream -> deep brown -> charcoal
  const baseR = 240, baseG = 220, baseB = 180;
  const burn = Math.min(color, 1.6);
  const r = Math.max(20, Math.round(baseR - 200 * burn));
  const g = Math.max(20, Math.round(baseG - 200 * burn));
  const b = Math.max(20, Math.round(baseB - 160 * burn));

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="kt.step1.title" stepKeyHint="kt.step1.hint" mood={color > 1.2 ? 'dish_burned' : color > 0.85 && color < 1.05 ? 'cheering' : 'idle'} moodValue={color > 1.2 ? -60 : 30} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          {/* grill */}
          <div className="w-56 h-8 bg-outline rounded-md grid grid-cols-6 gap-1 p-1">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-sambal/70 rounded" />)}
          </div>
          <div className="w-56 h-32 rounded-md border-2 border-outline shadow-soft" style={{ background: `rgb(${r},${g},${b})` }} />
          <button
            className="btn-primary thumb-target"
            onPointerDown={() => setHolding(true)}
            onPointerUp={() => { setHolding(false); finalize(); }}
            onPointerLeave={() => holding && (setHolding(false), finalize())}
          >
            {holding ? 'release' : 'hold to toast'}
          </button>
        </div>
      </div>
    </>
  );
}

// Step 2: Spread kaya — even spread scored higher
function SpreadStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [coverage, setCoverage] = useState(0);
  const [variance, setVariance] = useState(0);
  const finishedRef = useRef(false);

  usePointer(containerRef, (e) => {
    if (e.type !== 'down' && e.type !== 'move') return;
    const cv = ref.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const cx = (e.x / containerRef.current!.clientWidth) * cv.width;
    const cy = (e.y / containerRef.current!.clientHeight) * cv.height;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#A87A1F';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const cv = ref.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
      // sample 4x4 grid
      const cols = 4, rows = 4;
      const cellW = cv.width / cols, cellH = cv.height / rows;
      const counts: number[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let painted = 0, total = 0;
          for (let y = Math.floor(r * cellH); y < (r + 1) * cellH; y += 4) {
            for (let x = Math.floor(c * cellW); x < (c + 1) * cellW; x += 4) {
              total++;
              const idx = (y * cv.width + x) * 4;
              if (data[idx + 3] > 0) painted++;
            }
          }
          counts.push(total ? painted / total : 0);
        }
      }
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const v = Math.sqrt(counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length);
      setCoverage(mean);
      setVariance(v);
    }, 250);
    return () => clearInterval(id);
  }, []);

  const onDone = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // Even spread (low variance) scores higher
    const evenness = clamp(1 - variance * 3, 0, 1);
    const score = coverage * 0.5 + evenness * 0.5;
    const tier: ScoreTier = score >= 0.75 ? 'gold' : score >= 0.5 ? 'silver' : score >= 0.25 ? 'bronze' : 'miss';
    onComplete({ stepId: 'spread', tier, rawScore: score, durationMs: 0 });
  };

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="kt.step2.title" stepKeyHint="kt.step2.hint" mood={coverage > 0.5 ? 'tasting' : 'idle'} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div ref={containerRef} className="relative w-72 h-44 rounded-md border-2 border-outline overflow-hidden shadow-soft touch-none" style={{ background: '#5A3F26' }}>
            <canvas ref={ref} width={288} height={176} className="absolute inset-0 w-full h-full" />
          </div>
          <div className="text-xs text-outline/70">cov {Math.round(coverage * 100)}% · evenness {Math.round((1 - variance * 3) * 100)}%</div>
          <button className="btn-primary" onClick={onDone}>done</button>
        </div>
      </div>
    </>
  );
}

// Step 3: Egg crack + double-flick
function EggStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const [cracked, setCracked] = useState(false);
  const [flicks, setFlicks] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  usePointer(ref, (e) => {
    if (e.type === 'down') swipeStart.current = { x: e.x, y: e.y };
    else if (e.type === 'up' && swipeStart.current) {
      const dx = e.x - swipeStart.current.x;
      const dy = e.y - swipeStart.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 40 && cracked) {
        setFlicks((f) => f + 1);
        sfx.snap();
      }
      swipeStart.current = null;
    }
  });

  useEffect(() => {
    if (flicks >= 2) {
      setTimeout(() => onComplete({ stepId: 'egg', tier: 'gold', rawScore: 1, durationMs: 0 }), 300);
    }
  }, [flicks, onComplete]);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="kt.step3.title" stepKeyHint="kt.step3.hint" mood={cracked ? 'tasting' : 'idle'} />
      <div ref={ref} className="absolute inset-0 touch-none grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          {!cracked ? (
            <button className="text-7xl" onClick={() => { setCracked(true); sfx.snap(); }}>🥚</button>
          ) : (
            <div className="relative">
              <div className="text-7xl">🍳</div>
              <div className="absolute inset-0 grid place-items-center text-yellow-300 animate-pulse">{flicks > 0 && '✓'.repeat(flicks)}</div>
            </div>
          )}
          <div className="text-xs text-outline/60">{cracked ? `flick: soy → pepper (${flicks}/2)` : 'tap to crack'}</div>
        </div>
      </div>
    </>
  );
}

// Step 4: Kopi pour — hold and lift to extend pour
function KopiStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pourY, setPourY] = useState(80); // higher = taller pour stream
  const [holding, setHolding] = useState(false);
  const [froth, setFroth] = useState(0); // 0..1
  const startedY = useRef<number | null>(null);
  const finishedRef = useRef(false);

  usePointer(ref, (e) => {
    if (e.type === 'down') { setHolding(true); startedY.current = e.y; sfx.pour(); }
    else if (e.type === 'move' && holding) setPourY(clamp(e.y, 30, 250));
    else if (e.type === 'up' || e.type === 'cancel') { setHolding(false); finalize(); }
  });

  useEffect(() => {
    if (!holding) return;
    let raf = 0;
    const loop = () => {
      // higher pour (smaller y) = more froth
      const heightFactor = clamp((250 - pourY) / 220, 0, 1);
      setFroth((f) => clamp(f + heightFactor * 0.012, 0, 1));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [holding, pourY]);

  const finalize = () => {
    if (finishedRef.current) return;
    if (froth < 0.15 && !holding) return; // need at least some pour
    finishedRef.current = true;
    const tier: ScoreTier = froth >= 0.8 ? 'gold' : froth >= 0.55 ? 'silver' : froth >= 0.25 ? 'bronze' : 'miss';
    onComplete({ stepId: 'kopi', tier, rawScore: froth, durationMs: 0 });
  };

  // safety: auto-complete after 8s
  useEffect(() => {
    const t = setTimeout(() => { if (!finishedRef.current) { setHolding(false); finalize(); } }, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="kt.step4.title" stepKeyHint="kt.step4.hint" mood={froth > 0.6 ? 'cheering' : 'idle'} />
      <div ref={ref} className="absolute inset-0 touch-none">
        <svg viewBox="0 0 360 460" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* pourer */}
          <g transform={`translate(${holding ? 100 : 50}, ${pourY - 40})`}>
            <rect x="0" y="0" width="60" height="36" rx="6" fill="#3A2D24" />
            <ellipse cx="30" cy="36" rx="16" ry="6" fill="#5A4A42" />
            {/* spout */}
            <path d="M55 18 L80 12 L80 24 Z" fill="#3A2D24" />
          </g>
          {/* stream */}
          {holding && (
            <line x1="180" y1={pourY} x2="190" y2="320" stroke="#3A2D24" strokeWidth="3" opacity="0.6" />
          )}
          {/* cup */}
          <ellipse cx="200" cy="350" rx="60" ry="14" fill="#3A2D24" />
          <ellipse cx="200" cy="346" rx="56" ry="12" fill="#fff" />
          <ellipse cx="200" cy="346" rx="50" ry={8 + froth * 4} fill="#5A3F26" />
          {/* froth */}
          {froth > 0 && (
            <ellipse cx="200" cy="338" rx={40 + froth * 8} ry={3 + froth * 4} fill="#FFF7E8" opacity={0.8} />
          )}
        </svg>
        <div className="absolute bottom-24 left-0 right-0 text-center text-xs">
          {holding ? 'higher = more froth' : froth > 0 ? 'released' : 'press and hold'}
        </div>
      </div>
    </>
  );
}

const STEPS = [
  { id: 'toast', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <ToastStep onComplete={onComplete} /> },
  { id: 'spread', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <SpreadStep onComplete={onComplete} /> },
  { id: 'egg', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <EggStep onComplete={onComplete} /> },
  { id: 'kopi', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <KopiStep onComplete={onComplete} /> },
];

export default function KayaToast({ onComplete, onExit }: { onComplete: (r: DishResult) => void; onExit: () => void }) {
  return <DishRunner dishId="kaya-toast" steps={STEPS} onComplete={onComplete} onExit={onExit} />;
}
