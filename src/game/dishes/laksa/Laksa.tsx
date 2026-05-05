// Dish 2 — Katong Laksa.
// Signature gesture: circular drag in wok (rempah bloom).

import { useEffect, useRef, useState } from 'react';
import type { DishResult, ScoreTier, StepResult } from '../../../types';
import { DishRunner } from '../../engine/DishRunner';
import { HUD } from '../../engine/HUD';
import { useStep } from '../../engine/useStep';
import { useT } from '../../../i18n/useT';
import { sfx } from '../../../audio/audio';
import { usePointer, dist, clamp } from '../../engine/gestureHelpers';
import { scoreFromBands } from '../../engine/scoring';

const DISH = 'laksa';

// Step 1: Bloom rempah — circular drag, speed in band.
function BloomStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'bloom', durationMs: 9000, onComplete, dishId: DISH });
  const ref = useRef<HTMLDivElement>(null);
  const center = { x: 180, y: 200 };
  const lastAngle = useRef<number | null>(null);
  const lastT = useRef(performance.now());
  const speeds = useRef<number[]>([]);
  const [bloom, setBloom] = useState(0); // 0..1
  const [speed, setSpeed] = useState(0); // current normalized speed

  usePointer(ref, (e) => {
    if (e.type !== 'down' && e.type !== 'move') return;
    const dx = e.x - center.x;
    const dy = e.y - center.y;
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
      <div ref={ref} className="absolute inset-0 touch-none">
        <svg viewBox="0 0 360 460" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* wok */}
          <ellipse cx={center.x} cy={center.y + 20} rx="150" ry="20" fill="#3A2D24" />
          <ellipse cx={center.x} cy={center.y} rx="130" ry="80" fill="#5A4A42" />
          <ellipse cx={center.x} cy={center.y - 4} rx="124" ry="74" fill="#3A2D24" />
          {/* paste blob */}
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={70 + bloom * 10}
            ry={50 + bloom * 8}
            fill={`rgb(${r},${g},${b})`}
            opacity={0.85}
          />
          {/* speed ring around finger reference */}
          <circle cx={center.x} cy={center.y} r="100" fill="none" stroke={speed >= 0.6 && speed <= 1.2 ? '#6FB552' : '#3A2D2433'} strokeWidth="3" strokeDasharray="6 6" />
        </svg>
        <div className="absolute bottom-24 left-0 right-0 text-center text-sm">
          <div>{Math.round(bloom * 100)}%</div>
          <div className="text-[11px] text-outline/60">{speed >= 0.6 && speed <= 1.2 ? '✓ in band' : 'too ' + (speed > 1.2 ? 'fast' : 'slow')}</div>
        </div>
      </div>
    </>
  );
}

// Step 2: Sequenced snap targets — order matters
function OrderStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const t = useT();
  const { finish } = useStep({ stepId: 'order', onComplete, dishId: DISH, durationMs: 9000 });
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
      // visual broth split
    }
  };

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="la.step2.title" stepKeyHint="la.step2.hint" mood={split ? 'worried' : 'tutorial_pointing'} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-sm text-outline/70">{t('la.step2.hint')}</div>
        <div className={`w-56 h-32 rounded-3xl border-2 border-outline ${split ? 'bg-gradient-to-r from-kaya/40 to-marble' : 'bg-sambal/30'}`}>
          <div className="text-center text-xs pt-2">{split ? '⚠ broth split — keep stirring' : 'broth stable'}</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {(['stock', 'coconut', 'taupok'] as const).map((k, i) => (
            <button
              key={k}
              onClick={() => tap(k)}
              disabled={i < step}
              className={`thumb-target px-4 py-4 rounded-chip border-2 border-outline ${i < step ? 'bg-pandan/40 line-through' : 'bg-white'}`}
            >
              {k === 'stock' && '🍲'}
              {k === 'coconut' && '🥥'}
              {k === 'taupok' && '🟤'}
              <div className="text-[11px] mt-1">{k}</div>
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
  const { finish } = useStep({ stepId: 'noodle', onComplete, dishId: DISH, durationMs: 9000 });
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

  const glow = held >= 3500 && held <= 6500;

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="la.step3.title" stepKeyHint="la.step3.hint" mood={glow ? 'cheering' : 'idle'} />
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
  const items = ['🦐', '🥚', '🌿', '🌶'];
  const [placed, setPlaced] = useState<boolean[]>([false, false, false, false]);
  const [pos, setPos] = useState<{ x: number; y: number; idx: number | null }>({ x: 0, y: 0, idx: null });
  const ref = useRef<HTMLDivElement>(null);

  const target = { x: 180, y: 200 };

  usePointer(ref, (e) => {
    if (e.type === 'down') {
      // pick up nearest unplaced
      const idx = items.findIndex((_, i) => !placed[i]);
      if (idx >= 0) setPos({ x: e.x, y: e.y, idx });
    } else if (e.type === 'move' && pos.idx !== null) {
      setPos({ ...pos, x: e.x, y: e.y });
    } else if (e.type === 'up' && pos.idx !== null) {
      const onPlate = dist(e.x, e.y, target.x, target.y) < 90;
      if (onPlate) {
        sfx.snap();
        const idx = pos.idx;
        setPlaced((p) => p.map((v, i) => (i === idx ? true : v)));
      }
      setPos({ x: 0, y: 0, idx: null });
    }
  });

  const allDone = placed.every(Boolean);
  useEffect(() => {
    if (!allDone) return;
    const t = setTimeout(() => {
      onComplete({ stepId: 'garnish', tier: 'gold', rawScore: 1, durationMs: 0 });
    }, 400);
    return () => clearTimeout(t);
  }, [allDone, onComplete]);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="la.step4.title" stepKeyHint="la.step4.hint" mood={allDone ? 'tasting' : 'idle'} />
      <div ref={ref} className="absolute inset-0 touch-none">
        <svg viewBox="0 0 360 460" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* bowl */}
          <ellipse cx={target.x} cy={target.y} rx="100" ry="30" fill="#3A2D24" />
          <ellipse cx={target.x} cy={target.y - 4} rx="96" ry="28" fill="#D8432B" opacity="0.7" />
          <ellipse cx={target.x} cy={target.y - 8} rx="80" ry="20" fill="#E89B8B" />
          {placed.map((p, i) => p && (
            <text key={i} x={target.x - 30 + i * 18} y={target.y - 6} fontSize="22">{items[i]}</text>
          ))}
        </svg>
        {pos.idx !== null && (
          <div className="absolute pointer-events-none text-3xl" style={{ left: pos.x - 16, top: pos.y - 16 }}>
            {items[pos.idx]}
          </div>
        )}
        <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-3">
          {items.map((it, i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-chip border-2 border-outline grid place-items-center text-2xl ${placed[i] ? 'opacity-30' : 'bg-white'}`}
            >
              {it}
            </div>
          ))}
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-outline/60">{t('la.step4.hint')}</div>
      </div>
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
