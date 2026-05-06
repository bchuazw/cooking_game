// Dish 5 — Kaya Toast & Soft-Boiled Eggs (calm closer).
// Signature: hold-to-toast (color cue) + spread coverage with even-spread bonus.

import { useEffect, useRef, useState } from 'react';
import type { DishResult, ScoreTier, StepResult } from '../../../types';
import { DishRunner } from '../../engine/DishRunner';
import { HUD } from '../../engine/HUD';
import { useStep } from '../../engine/useStep';
import { sfx } from '../../../audio/audio';
import { usePointer, clamp } from '../../engine/gestureHelpers';
import { FoodDefs } from '../../../art/FoodIllustrations';
import { PixelIcon, PixelIconSvg } from '../../../art/PixelFood';

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
          <svg viewBox="0 0 300 260" className="w-72 max-w-[90vw] pixel-art" aria-hidden shapeRendering="crispEdges">
            <FoodDefs />
            <ellipse cx="150" cy="220" rx="112" ry="16" fill="rgba(58,45,36,0.2)" />
            <rect x="53" y="178" width="194" height="34" rx="8" fill="#3A2D24" />
            {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={68 + i * 24} y="184" width="12" height="22" rx="4" fill="#D8432B" opacity="0.8" />)}
            <g transform="translate(70, 42)">
              <path d="M18 128 L22 54 C22 18 138 18 138 54 L142 128 Z" fill={`rgb(${r},${g},${b})`} stroke="#3A2D24" strokeWidth="5" />
              <path d="M40 118 L43 58 C43 38 117 38 117 58 L120 118 Z" fill="rgba(255,230,175,0.34)" />
              <path d="M42 50 C58 36 102 36 118 50" stroke="#FFF2D4" strokeWidth="4" fill="none" opacity="0.55" />
              {color > 1.15 && <path d="M28 126 Q80 96 135 126" stroke="#17110E" strokeWidth="8" opacity="0.45" fill="none" />}
            </g>
          </svg>
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

  // Timeout fallback after 12s — auto-finalize with whatever progress.
  useEffect(() => {
    const id = setTimeout(() => { if (!finishedRef.current) onDone(); }, 12000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div ref={containerRef} className="relative w-72 h-48 overflow-hidden touch-none">
            <svg viewBox="0 0 288 192" className="absolute inset-0 h-full w-full pixel-art" aria-hidden shapeRendering="crispEdges">
              <FoodDefs />
              <ellipse cx="144" cy="166" rx="108" ry="12" fill="rgba(58,45,36,0.2)" />
              <path d="M39 158 L43 55 C43 22 245 22 245 55 L249 158 Z" fill="url(#fi-bread)" stroke="#3A2D24" strokeWidth="5" />
              <path d="M63 144 L66 61 C66 42 222 42 222 61 L225 144 Z" fill="#FFE0A7" opacity="0.78" />
            </svg>
            <canvas ref={ref} width={288} height={176} className="absolute left-0 top-2 w-full h-[176px] [clip-path:polygon(15%_18%,85%_18%,88%_88%,12%_88%)]" />
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
            <button className="pixel-token thumb-target p-5" onClick={() => { setCracked(true); sfx.snap(); }} aria-label="crack egg">
              <PixelIconSvg kind="egg" size={110} title="egg" />
            </button>
          ) : (
            <div className="relative">
              <PixelIconSvg kind="crackedEgg" size={132} title="soft-boiled egg" />
              <div className="absolute inset-0 grid place-items-center text-kaya-shade text-3xl font-bold animate-pulse">{flicks > 0 && '✓'.repeat(flicks)}</div>
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
  const frothRef = useRef(0);
  const startedY = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    frothRef.current = froth;
  }, [froth]);

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

  const finalize = (force = false) => {
    if (finishedRef.current) return;
    const score = frothRef.current;
    if (score < 0.15 && !force) return; // need at least some pour
    finishedRef.current = true;
    const tier: ScoreTier = score >= 0.8 ? 'gold' : score >= 0.55 ? 'silver' : score >= 0.25 ? 'bronze' : 'miss';
    onComplete({ stepId: 'kopi', tier, rawScore: score, durationMs: 0 });
  };

  useEffect(() => {
    if (froth < 0.9 || finishedRef.current) return;
    setHolding(false);
    sfx.chime();
    finalize(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [froth]);

  // safety: auto-complete after 8s
  useEffect(() => {
    const t = setTimeout(() => { if (!finishedRef.current) { setHolding(false); finalize(true); } }, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="kt.step4.title" stepKeyHint="kt.step4.hint" mood={froth > 0.6 ? 'cheering' : 'idle'} />
      <div ref={ref} className="absolute inset-0 touch-none">
        <svg viewBox="0 0 360 460" className="h-full w-full pixel-art" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
          <FoodDefs />
          {/* pourer */}
          <g transform={`translate(${holding ? 100 : 50}, ${pourY - 40})`}>
            <rect x="0" y="0" width="62" height="38" rx="8" fill="#3A2D24" />
            <rect x="6" y="5" width="50" height="23" rx="5" fill="#6B5A50" opacity="0.75" />
            <ellipse cx="31" cy="38" rx="17" ry="7" fill="#5A4A42" />
            {/* spout */}
            <path d="M55 18 L80 12 L80 24 Z" fill="#3A2D24" />
          </g>
          {/* stream */}
          {holding && (
            <path d={`M180 ${pourY} C178 ${pourY + 70} 196 242 190 320`} stroke="#5A3F26" strokeWidth="5" opacity="0.75" fill="none" strokeLinecap="round" />
          )}
          {/* cup */}
          <g transform="translate(146, 300) scale(1.18)">
            <PixelIcon kind="kopiCup" size={100} />
          </g>
          {/* froth */}
          {froth > 0 && (
            <ellipse cx="205" cy="342" rx={38 + froth * 9} ry={4 + froth * 5} fill="#FFF7E8" opacity={0.88} />
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
