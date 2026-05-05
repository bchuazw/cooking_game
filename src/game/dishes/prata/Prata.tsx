// Dish 3 — Roti Prata.
// Signature: flick-flip with shadow alignment (3 flips).

import { useEffect, useRef, useState } from 'react';
import type { DishResult, ScoreTier, StepResult } from '../../../types';
import { DishRunner } from '../../engine/DishRunner';
import { HUD } from '../../engine/HUD';
import { useStep } from '../../engine/useStep';
import { sfx } from '../../../audio/audio';
import { usePointer, dist, clamp } from '../../engine/gestureHelpers';

const DISH = 'prata';

// Step 1: Knead — pinch outwards (two-finger)
function KneadStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'knead', durationMs: 9000, onComplete, dishId: DISH });
  const [stretch, setStretch] = useState(0); // 0..1
  const ref = useRef<HTMLDivElement>(null);
  const points = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialDist = useRef<number | null>(null);

  usePointer(ref, (e) => {
    if (e.type === 'down') points.current.set(e.id, { x: e.x, y: e.y });
    else if (e.type === 'move') points.current.set(e.id, { x: e.x, y: e.y });
    else { points.current.delete(e.id); initialDist.current = null; return; }
    if (points.current.size >= 2) {
      const [a, b] = Array.from(points.current.values()).slice(0, 2);
      const d = dist(a.x, a.y, b.x, b.y);
      if (initialDist.current === null) initialDist.current = d;
      const delta = d - initialDist.current;
      if (delta > 4) {
        setStretch((s) => clamp(s + 0.01, 0, 1));
        initialDist.current = d;
      }
    } else {
      // single-finger fallback: drag distance increments
      setStretch((s) => clamp(s + 0.003, 0, 1));
    }
  });

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = stretch >= 0.85 ? 'gold' : stretch >= 0.6 ? 'silver' : stretch >= 0.3 ? 'bronze' : 'miss';
    finish(tier, stretch);
  }, [remaining, stretch, finish]);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="pr.step1.title" stepKeyHint="pr.step1.hint" remaining={remaining} total={9000} mood="idle" moodValue={stretch * 60 - 20} />
      <div ref={ref} className="absolute inset-0 touch-none flex items-center justify-center">
        <div className="relative" style={{ width: `${120 + stretch * 200}px`, height: `${120 - stretch * 30}px` }}>
          <div className="w-full h-full rounded-full bg-[#F1C9A4] border-2 border-outline shadow-soft" />
          <div className="absolute inset-3 rounded-full bg-[#FFE9CC] opacity-70" />
        </div>
        <div className="absolute bottom-28 text-xs text-outline/60">{Math.round(stretch * 100)}%</div>
      </div>
    </>
  );
}

// Step 2: Slap-stretch — left-right swipes build thinness meter
function SlapStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'slap', durationMs: 11000, onComplete, dishId: DISH });
  const [thinness, setThinness] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const lastX = useRef<number | null>(null);

  usePointer(ref, (e) => {
    if (e.type === 'down') lastX.current = e.x;
    else if (e.type === 'move' && lastX.current !== null) {
      const dx = e.x - lastX.current;
      if (Math.abs(dx) > 30) {
        setThinness((t) => clamp(t + 0.025, 0, 1));
        sfx.thud();
        lastX.current = e.x;
      }
    } else if (e.type === 'up') {
      lastX.current = null;
    }
  });

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = thinness >= 0.85 ? 'gold' : thinness >= 0.7 ? 'silver' : thinness >= 0.5 ? 'bronze' : 'miss';
    finish(tier, thinness);
  }, [remaining, thinness, finish]);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="pr.step2.title" stepKeyHint="pr.step2.hint" remaining={remaining} total={11000} mood={thinness > 0.7 ? 'cheering' : 'idle'} />
      <div ref={ref} className="absolute inset-0 touch-none flex items-center justify-center">
        <div className="relative" style={{ width: `${200 + thinness * 100}px`, height: `${100 - thinness * 60}px`, opacity: 1 - thinness * 0.4 }}>
          <div className="w-full h-full rounded-full bg-[#F1C9A4] border-2 border-outline shadow-soft" />
        </div>
        <div className="absolute bottom-28 w-44">
          <div className="h-3 bg-white border-2 border-outline rounded-full overflow-hidden">
            <div className="h-full bg-pandan transition-all" style={{ width: `${thinness * 100}%` }} />
          </div>
          <div className="text-center text-[10px] mt-1 text-outline/60">{Math.round(thinness * 100)}% (target 70%)</div>
        </div>
      </div>
    </>
  );
}

// Step 3: Flick-flip — swipe up to flick, tap when shadow aligns. 3 flips.
function FlickStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'flick', onComplete, dishId: DISH, durationMs: 14000 });
  const [phase, setPhase] = useState<'idle' | 'flying' | 'caught'>('idle');
  const [flipsDone, setFlipsDone] = useState(0);
  const flightStart = useRef(0);
  const [shadowProgress, setShadowProgress] = useState(0); // 0..1
  const ref = useRef<HTMLDivElement>(null);
  const swipeStartY = useRef<number | null>(null);
  const flipsRequired = 3;
  const goodFlips = useRef(0);

  // Timeout fallback if player doesn't finish all flips within the window.
  useEffect(() => {
    if (remaining > 0) return;
    if (flipsDone >= flipsRequired) return; // already finishing via the other effect
    const ratio = goodFlips.current / flipsRequired;
    const tier: ScoreTier = ratio >= 0.66 ? 'silver' : ratio > 0 ? 'bronze' : 'miss';
    finish(tier, ratio);
  }, [remaining, flipsDone, finish]);

  useEffect(() => {
    if (phase !== 'flying') return;
    flightStart.current = performance.now();
    let raf = 0;
    const loop = () => {
      const t = (performance.now() - flightStart.current) / 1500; // 1.5s flight
      setShadowProgress(t);
      if (t >= 1.4) {
        // missed — count as bronze flip
        setPhase('caught');
        setTimeout(() => {
          setFlipsDone((f) => f + 1);
          setPhase('idle');
        }, 300);
      } else {
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (flipsDone >= flipsRequired) {
      const ratio = goodFlips.current / flipsRequired;
      const tier: ScoreTier = ratio >= 0.85 ? 'gold' : ratio >= 0.5 ? 'silver' : 'bronze';
      finish(tier, ratio);
    }
  }, [flipsDone, finish]);

  usePointer(ref, (e) => {
    if (e.type === 'down') swipeStartY.current = e.y;
    else if (e.type === 'up' && swipeStartY.current !== null) {
      const dy = e.y - swipeStartY.current;
      if (dy < -40 && phase === 'idle') {
        setPhase('flying');
        sfx.snap();
      }
      swipeStartY.current = null;
    }
  });

  const tapCatch = () => {
    if (phase !== 'flying') return;
    // gold band: shadow at 0.85..1.0
    const t = shadowProgress;
    if (t >= 0.85 && t <= 1.05) {
      goodFlips.current += 1;
      sfx.chime();
    } else {
      sfx.error();
    }
    setPhase('caught');
    setTimeout(() => {
      setFlipsDone((f) => f + 1);
      setPhase('idle');
    }, 300);
  };

  // Visual: dough Y based on parabola
  const t = shadowProgress;
  const yOff = phase === 'flying' ? -200 * (1 - Math.pow(2 * t - 1, 2)) : 0;
  const shadowScale = phase === 'flying' ? 0.6 + Math.abs(2 * t - 1) * 0.4 : 1;

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="pr.step3.title" stepKeyHint="pr.step3.hint" remaining={remaining} total={14000} mood={flipsDone === flipsRequired ? 'cheering' : 'idle'} />
      <div ref={ref} className="absolute inset-0 touch-none">
        <svg viewBox="0 0 360 460" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* tawa pan */}
          <ellipse cx="180" cy="320" rx="120" ry="22" fill="#3A2D24" />
          <ellipse cx="180" cy="316" rx="115" ry="20" fill="#5A4A42" />
          {/* shadow on pan */}
          <ellipse cx="180" cy="316" rx={50 * shadowScale} ry={10 * shadowScale} fill="rgba(0,0,0,0.35)" />
          {/* dough */}
          <g transform={`translate(${180 + (phase === 'flying' ? Math.sin(t * Math.PI * 4) * 10 : 0)}, ${300 + yOff})`}>
            <ellipse cx="0" cy="0" rx="50" ry="10" fill="#FFE9CC" stroke="#3A2D24" strokeWidth="2" transform={phase === 'flying' ? `rotate(${t * 720})` : ''} />
          </g>
          <text x="180" y="60" fontSize="22" textAnchor="middle" fontWeight="700" fill="#3A2D24">{flipsDone}/{flipsRequired}</text>
        </svg>
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
          <button
            className="btn-ghost thumb-target"
            onClick={() => phase === 'idle' && setPhase('flying')}
          >
            ↑ flick
          </button>
          <button
            className="btn-primary thumb-target"
            onClick={tapCatch}
            disabled={phase !== 'flying'}
          >
            catch
          </button>
        </div>
      </div>
    </>
  );
}

// Step 4: Fold corners
function FoldStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const [folded, setFolded] = useState(0);
  useEffect(() => {
    if (folded >= 4) {
      setTimeout(() => onComplete({ stepId: 'fold', tier: 'gold', rawScore: 1, durationMs: 0 }), 300);
    }
  }, [folded, onComplete]);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="pr.step4.title" stepKeyHint="pr.step4.hint" mood={folded === 4 ? 'tasting' : 'idle'} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-60 h-60">
          <div className="absolute inset-0 rounded-2xl bg-[#FFE9CC] border-2 border-outline" style={{ transform: `scale(${1 - folded * 0.1}) rotate(${folded * 8}deg)` }} />
          {(['tl', 'tr', 'bl', 'br'] as const).map((corner, i) => {
            const positions: Record<string, string> = { tl: 'top-0 left-0', tr: 'top-0 right-0', bl: 'bottom-0 left-0', br: 'bottom-0 right-0' };
            return (
              <button
                key={corner}
                disabled={folded > i}
                className={`absolute thumb-target w-12 h-12 rounded-chip border-2 border-outline ${folded > i ? 'bg-pandan/40' : 'bg-white'} ${positions[corner]}`}
                onClick={() => { setFolded((f) => f + 1); sfx.snap(); }}
              >
                {folded > i ? '✓' : '◢'}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

const STEPS = [
  { id: 'knead', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <KneadStep onComplete={onComplete} /> },
  { id: 'slap', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <SlapStep onComplete={onComplete} /> },
  { id: 'flick', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <FlickStep onComplete={onComplete} /> },
  { id: 'fold', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <FoldStep onComplete={onComplete} /> },
];

export default function Prata({ onComplete, onExit }: { onComplete: (r: DishResult) => void; onExit: () => void }) {
  return <DishRunner dishId="prata" steps={STEPS} onComplete={onComplete} onExit={onExit} />;
}
