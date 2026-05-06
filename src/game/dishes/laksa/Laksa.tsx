// Dish 2 — Katong Laksa.
// Signature gesture: circular drag in wok (rempah bloom).

import { useEffect, useRef, useState } from 'react';
import type { DishResult, ScoreTier, StepResult } from '../../../types';
import { DishRunner } from '../../engine/DishRunner';
import { HUD } from '../../engine/HUD';
import { useStep } from '../../engine/useStep';
import { useT } from '../../../i18n/useT';
import { sfx } from '../../../audio/audio';
import { usePointer, dist, clamp, clientToSvg } from '../../engine/gestureHelpers';
import { scoreFromBands } from '../../engine/scoring';
import { FoodDefs, FoodIcon, FoodIconSvg, IllustratedPlate, type FoodKind } from '../../../art/FoodIllustrations';

const DISH = 'laksa';

// Step 1: Bloom rempah — circular drag, speed in band.
function BloomStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'bloom', durationMs: 9000, onComplete, dishId: DISH });
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const center = { x: 180, y: 200 };
  const lastAngle = useRef<number | null>(null);
  const lastT = useRef(performance.now());
  const speeds = useRef<number[]>([]);
  const [bloom, setBloom] = useState(0); // 0..1
  const [speed, setSpeed] = useState(0); // current normalized speed

  usePointer(ref, (e) => {
    if (e.type !== 'down' && e.type !== 'move') return;
    const vb = clientToSvg(svgRef.current, e.raw.clientX, e.raw.clientY);
    const dx = vb.x - center.x;
    const dy = vb.y - center.y;
    const angle = Math.atan2(dy, dx);
    const now = performance.now();
    if (lastAngle.current !== null) {
      let da = angle - lastAngle.current;
      if (da > Math.PI) da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      const dt = Math.max(1, now - lastT.current);
      const angularVel = Math.abs(da) / (dt / 1000); // rad/s
      // target band: 4–8 rad/s
      const norm = clamp(angularVel / 6, 0, 2);
      setSpeed(norm);
      speeds.current.push(norm);
      if (speeds.current.length > 30) speeds.current.shift();
      // bloom progress: each in-band tick adds; out-of-band slows
      const inBand = angularVel >= 4 && angularVel <= 8;
      setBloom((b) => clamp(b + (inBand ? 0.012 : -0.004), 0, 1));
      if (inBand && Math.random() < 0.05) sfx.bubble();
    }
    lastAngle.current = angle;
    lastT.current = now;
  });

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = scoreFromBands(bloom, 0.85, 0.55, 0.25);
    finish(tier, bloom);
  }, [remaining, bloom, finish]);

  // Color shift: dull red -> deep orange
  const r = Math.round(170 + 50 * bloom);
  const g = Math.round(60 + 80 * bloom);
  const b = Math.round(40 - 10 * bloom);

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="la.step1.title"
        stepKeyHint="la.step1.hint"
        remaining={remaining}
        total={9000}
        mood={bloom > 0.6 ? 'cheering' : 'idle'}
        moodValue={bloom * 80 - 30}
      />
      <div className="absolute inset-0 grid place-items-center pt-28 pb-20 px-2">
        <div ref={ref} className="relative w-full max-w-full max-h-full aspect-[360/460] touch-none">
          <svg ref={svgRef} viewBox="0 0 360 460" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="wok-iron" cx="0.5" cy="0.4" r="0.7">
                <stop offset="0%" stopColor="#5A4A42" />
                <stop offset="60%" stopColor="#2D1F18" />
                <stop offset="100%" stopColor="#1B1A1A" />
              </radialGradient>
              <radialGradient id="wok-rim-light" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="rgba(255,200,150,0.0)" />
                <stop offset="80%" stopColor="rgba(255,200,150,0.3)" />
              </radialGradient>
              <radialGradient id="rempah-paste" cx="0.5" cy="0.5" r="0.6">
                <stop offset="0%" stopColor={`rgb(${Math.min(255, r + 40)},${Math.min(255, g + 30)},${b})`} />
                <stop offset="60%" stopColor={`rgb(${r},${g},${b})`} />
                <stop offset="100%" stopColor={`rgb(${Math.max(0, r - 50)},${Math.max(0, g - 30)},${Math.max(0, b - 10)})`} />
              </radialGradient>
            </defs>

            {/* table shadow */}
            <ellipse cx={center.x} cy={center.y + 100} rx="170" ry="14" fill="rgba(58,45,36,0.25)" />
            {/* heat glow under wok */}
            <ellipse cx={center.x} cy={center.y + 80} rx="120" ry="28" fill="rgba(232,184,58,0.25)" />
            {/* wok handles */}
            <g transform={`translate(${center.x - 150}, ${center.y - 10})`}>
              <ellipse cx="0" cy="0" rx="22" ry="9" fill="#2D1F18" stroke="#1B1A1A" strokeWidth="1.5" />
              <ellipse cx="-2" cy="-2" rx="16" ry="5" fill="rgba(255,255,255,0.1)" />
            </g>
            <g transform={`translate(${center.x + 150}, ${center.y - 10})`}>
              <ellipse cx="0" cy="0" rx="22" ry="9" fill="#2D1F18" stroke="#1B1A1A" strokeWidth="1.5" />
              <ellipse cx="-2" cy="-2" rx="16" ry="5" fill="rgba(255,255,255,0.1)" />
            </g>
            {/* wok bowl outer */}
            <ellipse cx={center.x} cy={center.y + 18} rx="150" ry="24" fill="#1B1A1A" />
            <path d={`M ${center.x - 145} ${center.y - 10} Q ${center.x - 160} ${center.y + 60} ${center.x} ${center.y + 70} Q ${center.x + 160} ${center.y + 60} ${center.x + 145} ${center.y - 10} Z`} fill="url(#wok-iron)" stroke="#1B1A1A" strokeWidth="2" />
            {/* wok inner */}
            <ellipse cx={center.x} cy={center.y - 4} rx="135" ry="72" fill="#1B1A1A" />
            <ellipse cx={center.x} cy={center.y - 4} rx="128" ry="68" fill="url(#wok-iron)" />
            {/* rim highlight (top) */}
            <ellipse cx={center.x} cy={center.y - 8} rx="125" ry="62" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {/* season patina rings */}
            {[55, 40, 22].map((r) => (
              <ellipse key={r} cx={center.x} cy={center.y - 2} rx={r * 1.6} ry={r * 0.8} fill="none" stroke="rgba(255,180,120,0.08)" strokeWidth="1" />
            ))}

            {/* paste blob (rempah) — ridge and texture */}
            <ellipse cx={center.x} cy={center.y + 4} rx={70 + bloom * 12} ry={50 + bloom * 10} fill="rgba(0,0,0,0.4)" />
            <ellipse cx={center.x} cy={center.y} rx={70 + bloom * 10} ry={50 + bloom * 8} fill="url(#rempah-paste)" stroke={`rgb(${Math.max(0, r - 70)},${Math.max(0, g - 50)},${Math.max(0, b - 20)})`} strokeWidth="1.2" />
            {/* paste highlight */}
            <ellipse cx={center.x - 12} cy={center.y - 12} rx={28 + bloom * 8} ry={14 + bloom * 4} fill={`rgba(255,200,140,${0.2 + bloom * 0.3})`} />
            {/* chili / shallot bits poking out */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              const rad = 50 + bloom * 6;
              const cx = center.x + Math.cos(a) * rad;
              const cy = center.y + Math.sin(a) * rad * 0.7;
              return (
                <g key={i}>
                  <ellipse cx={cx} cy={cy} rx="3" ry="2" fill={i % 2 === 0 ? '#D8432B' : '#FFD9A0'} stroke={i % 2 === 0 ? '#7E2113' : '#A87A50'} strokeWidth="0.4" />
                </g>
              );
            })}
            {/* shimmer */}
            {bloom > 0.4 && (
              <g opacity={Math.min(0.8, bloom)}>
                <path d={`M ${center.x - 60} ${center.y - 50} q -10 -16 0 -28`} stroke="rgba(255,237,200,0.6)" strokeWidth="2" fill="none" />
                <path d={`M ${center.x + 60} ${center.y - 50} q 10 -16 0 -28`} stroke="rgba(255,237,200,0.6)" strokeWidth="2" fill="none" />
              </g>
            )}
            {/* speed ring around finger reference */}
            <circle cx={center.x} cy={center.y} r="100" fill="none" stroke={speed >= 0.6 && speed <= 1.2 ? '#6FB552' : '#3A2D2433'} strokeWidth="3" strokeDasharray="8 6" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-20 left-0 right-0 text-center text-sm pointer-events-none">
        <div>{Math.round(bloom * 100)}%</div>
        <div className="text-[11px] text-outline/60">{speed >= 0.6 && speed <= 1.2 ? '✓ in band' : 'too ' + (speed > 1.2 ? 'fast' : 'slow')}</div>
      </div>
    </>
  );
}

// Step 2: Sequenced snap targets — order matters
function OrderStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const t = useT();
  const { remaining, finish } = useStep({ stepId: 'order', onComplete, dishId: DISH, durationMs: 9000 });
  const order = ['stock', 'coconut', 'taupok'] as const;
  const [step, setStep] = useState(0);
  const [split, setSplit] = useState(false);

  const tap = (key: typeof order[number]) => {
    const expected = order[step];
    if (key === expected) {
      sfx.snap();
      setStep((s) => s + 1);
      if (step + 1 >= order.length) {
        finish(split ? 'silver' : 'gold', split ? 0.7 : 1);
      }
    } else {
      sfx.error();
      setSplit(true);
    }
  };

  // Timeout fallback so the step always advances — score reflects progress.
  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier =
      step === order.length ? (split ? 'silver' : 'gold')
      : step === 2 ? 'silver'
      : step === 1 ? 'bronze'
      : 'miss';
    finish(tier, step / order.length);
  }, [remaining, step, split, finish, order.length]);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="la.step2.title" stepKeyHint="la.step2.hint" remaining={remaining} total={9000} mood={split ? 'worried' : 'tutorial_pointing'} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 pt-32 pb-20">
        <div className={`relative w-72 h-40 rounded-[28px] border-2 border-outline grid place-items-center overflow-hidden shadow-soft ${split ? 'bg-gradient-to-r from-kaya/40 to-marble' : 'bg-sambal/20'}`}>
          <svg viewBox="0 0 280 150" className="absolute inset-0 w-full h-full" aria-hidden>
            <FoodDefs />
            <ellipse cx="140" cy="90" rx="108" ry="28" fill="#3A2D24" opacity="0.3" />
            <ellipse cx="140" cy="82" rx="104" ry="44" fill="url(#fi-laksa)" stroke="#3A2D24" strokeWidth="3" />
            <path d="M65 78 Q110 60 156 78 T224 76" stroke={split ? '#FFF7E8' : '#FFE4C0'} strokeWidth="6" fill="none" opacity={split ? 0.35 : 0.7} strokeLinecap="round" />
            {split && <path d="M50 62 Q110 100 228 61" stroke="#F4EFE6" strokeWidth="5" strokeDasharray="10 8" fill="none" opacity="0.9" />}
          </svg>
          <div className="relative text-center text-xs px-3 font-bold text-outline">{split ? t('la.step2.broth_split') : t('la.step2.broth_stable')}</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['stock', 'coconut', 'taupok'] as const).map((k, i) => (
            <button
              key={k}
              onClick={() => tap(k)}
              disabled={i < step}
              className={`thumb-target px-3 py-3 rounded-[18px] border-2 border-outline shadow-soft ${i < step ? 'bg-pandan/25 line-through' : 'bg-white'}`}
            >
              <FoodIconSvg kind={k === 'stock' ? 'stock' : k === 'coconut' ? 'coconut' : 'taupok'} size={58} title={t(`la.step2.${k}`)} />
              <div className="text-[11px] mt-1">{t(`la.step2.${k}`)}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Step 3: Noodle bath — release in 4–6s window
function NoodleStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const t = useT();
  const { remaining, finish } = useStep({ stepId: 'noodle', onComplete, dishId: DISH, durationMs: 9000 });
  const [holding, setHolding] = useState(false);
  const [held, setHeld] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!holding) return;
    startRef.current = performance.now();
    let raf = 0;
    const loop = () => {
      if (startRef.current) {
        setHeld(performance.now() - startRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [holding]);

  const release = () => {
    setHolding(false);
    const ms = held;
    let tier: ScoreTier;
    if (ms >= 4000 && ms <= 6000) tier = 'gold';
    else if (ms >= 3000 && ms <= 7000) tier = 'silver';
    else if (ms >= 2000) tier = 'bronze';
    else tier = 'miss';
    finish(tier, ms >= 4000 && ms <= 6000 ? 1 : 0.5);
  };

  // Timeout fallback (mushy noodles).
  useEffect(() => {
    if (remaining > 0) return;
    finish(held >= 2000 ? 'bronze' : 'miss', 0.3);
  }, [remaining, held, finish]);

  const glow = held >= 3500 && held <= 6500;

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="la.step3.title" stepKeyHint="la.step3.hint" remaining={remaining} total={9000} mood={glow ? 'cheering' : 'idle'} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-44 h-44 rounded-full bg-tile-teal/30 border-2 border-outline" />
          <div
            className={`absolute inset-6 rounded-full ${glow ? 'bg-kaya animate-pulse' : 'bg-marble'} border-2 border-outline grid place-items-center`}
          >
            <div className="text-3xl">🍜</div>
          </div>
        </div>
        <div className="text-xs text-outline/60 mt-2">{(held / 1000).toFixed(1)}s {glow ? '— now!' : ''}</div>
        <button
          className={`btn-primary mt-6 thumb-target ${holding ? 'bg-sambal-shade' : ''}`}
          onPointerDown={() => setHolding(true)}
          onPointerUp={() => holding && release()}
          onPointerLeave={() => holding && release()}
        >
          {holding ? t('menu.done') : 'hold ↓'}
        </button>
      </div>
    </>
  );
}

// Step 4: Garnish — drag-snap items
function GarnishStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const t = useT();
  const items: { kind: FoodKind; label: string; x: number; y: number }[] = [
    { kind: 'prawn', label: 'prawn', x: 133, y: 178 },
    { kind: 'fishcake', label: 'fishcake', x: 169, y: 184 },
    { kind: 'sprouts', label: 'sprouts', x: 199, y: 174 },
    { kind: 'sambal', label: 'sambal', x: 228, y: 185 },
  ];
  const [placed, setPlaced] = useState<boolean[]>([false, false, false, false]);
  // pos.x/y in container px (for the dragged emoji follow), pos.vbX/vbY in viewBox px (for snap distance check).
  const [pos, setPos] = useState<{ x: number; y: number; vbX: number; vbY: number; idx: number | null }>({ x: 0, y: 0, vbX: 0, vbY: 0, idx: null });
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const target = { x: 180, y: 200 }; // viewBox coords

  usePointer(ref, (e) => {
    const vb = clientToSvg(svgRef.current, e.raw.clientX, e.raw.clientY);
    if (e.type === 'down') {
      const idx = items.findIndex((_, i) => !placed[i]);
      if (idx >= 0) setPos({ x: e.x, y: e.y, vbX: vb.x, vbY: vb.y, idx });
    } else if (e.type === 'move' && pos.idx !== null) {
      setPos({ ...pos, x: e.x, y: e.y, vbX: vb.x, vbY: vb.y });
    } else if (e.type === 'up' && pos.idx !== null) {
      const onPlate = dist(vb.x, vb.y, target.x, target.y) < 90;
      if (onPlate) {
        sfx.snap();
        const idx = pos.idx;
        setPlaced((p) => p.map((v, i) => (i === idx ? true : v)));
      }
      setPos({ x: 0, y: 0, vbX: 0, vbY: 0, idx: null });
    }
  });

  const allDone = placed.every(Boolean);
  useEffect(() => {
    if (!allDone) return;
    const id = setTimeout(() => {
      onComplete({ stepId: 'garnish', tier: 'gold', rawScore: 1, durationMs: 0 });
    }, 400);
    return () => clearTimeout(id);
  }, [allDone, onComplete]);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="la.step4.title" stepKeyHint="la.step4.hint" mood={allDone ? 'tasting' : 'idle'} />
      <div className="absolute inset-0 grid place-items-center pt-28 pb-24 px-2">
        <div ref={ref} className="relative w-full max-w-full max-h-full aspect-[360/460] touch-none">
          <svg ref={svgRef} viewBox="0 0 360 460" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            <FoodDefs />
            <IllustratedPlate x={target.x} y={target.y} rx={112} ry={34} />
            <ellipse cx={target.x} cy={target.y - 9} rx="82" ry="24" fill="url(#fi-laksa)" stroke="rgba(58,45,36,0.25)" strokeWidth="1.5" />
            <path d={`M ${target.x - 58} ${target.y - 12} q 16 9 32 0 t32 0 t32 0`} stroke="#FFEBC5" strokeWidth="4" fill="none" strokeLinecap="round" />
            {placed.map((p, i) => p && (
              <FoodIcon key={i} kind={items[i].kind} x={items[i].x - 18} y={items[i].y - 18} size={36} />
            ))}
          </svg>
          {pos.idx !== null && (
            <div className="absolute pointer-events-none" style={{ left: pos.x - 28, top: pos.y - 28 }}>
              <FoodIconSvg kind={items[pos.idx].kind} size={56} title={items[pos.idx].label} />
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-3 pointer-events-none">
        {items.map((it, i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-[16px] border-2 border-outline grid place-items-center shadow-soft ${placed[i] ? 'opacity-30 bg-pandan/20' : 'bg-white'}`}
          >
            <FoodIconSvg kind={it.kind} size={44} title={it.label} />
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-outline/60 pointer-events-none">{t('la.step4.hint')}</div>
    </>
  );
}

const STEPS = [
  { id: 'bloom', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <BloomStep onComplete={onComplete} /> },
  { id: 'order', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <OrderStep onComplete={onComplete} /> },
  { id: 'noodle', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <NoodleStep onComplete={onComplete} /> },
  { id: 'garnish', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <GarnishStep onComplete={onComplete} /> },
];

export default function Laksa({ onComplete, onExit }: { onComplete: (r: DishResult) => void; onExit: () => void }) {
  return <DishRunner dishId="laksa" steps={STEPS} onComplete={onComplete} onExit={onExit} />;
}
