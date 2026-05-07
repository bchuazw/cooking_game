// Dish 3 - Roti Prata.

import { useEffect, useRef, useState } from 'react';
import type { DishResult, ScoreTier, StepResult } from '../../../types';
import { BubbleLayer, SteamWisps } from '../../../art/GameFX';
import { DishRunner } from '../../engine/DishRunner';
import { HUD } from '../../engine/HUD';
import { useStep } from '../../engine/useStep';
import { sfx } from '../../../audio/audio';
import { usePointer, dist, clamp } from '../../engine/gestureHelpers';
import { scoreFromBands } from '../../engine/scoring';

const DISH = 'prata';
const BASE = (import.meta.env.BASE_URL as string) ?? '/';
const DOUGH_BALL = `${BASE}assets/gameplay/prata-dough-ball-620.webp`;
const DOUGH_SHEET = `${BASE}assets/gameplay/prata-dough-sheet-760.webp`;
const PRATA_PLATE = `${BASE}assets/gameplay/prata-plate-700.webp`;

function ProgressCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="surface w-full max-w-xs px-4 py-3">
      <div className="mb-2 flex justify-between text-xs font-black text-outline/70">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="pixel-meter h-[13px] w-full">
        <span style={{ width: `${value * 100}%` }} />
      </div>
      {hint && <div className="mt-2 text-center text-[10px] font-black text-outline/55">{hint}</div>}
    </div>
  );
}

function KneadStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'knead', durationMs: 10000, onComplete, dishId: DISH });
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const progressRef = useRef(0);
  const touched = useRef(false);
  const [smooth, setSmooth] = useState(0);

  const scoreAndFinish = (value: number) => {
    if (value < 0.82) return;
    finish(scoreFromBands(value, 0.82, 0.62, 0.38), value);
  };

  usePointer(ref, (e) => {
    if (e.type === 'down') {
      touched.current = true;
      last.current = { x: e.x, y: e.y };
      return;
    }
    if (e.type === 'up' || e.type === 'cancel') {
      const value = progressRef.current;
      last.current = null;
      scoreAndFinish(value);
      return;
    }
    if (e.type !== 'move' || !last.current) return;

    const d = dist(e.x, e.y, last.current.x, last.current.y);
    if (d > 2) {
      setSmooth((v) => {
        const next = clamp(v + d / 2800, 0, 1);
        progressRef.current = next;
        return next;
      });
      if (d > 14 && Math.random() < 0.05) sfx.thud();
    }
    last.current = { x: e.x, y: e.y };
  });

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = touched.current ? scoreFromBands(smooth, 0.82, 0.62, 0.38) : 'miss';
    finish(tier, smooth);
  }, [remaining, smooth, finish]);

  const ready = smooth >= 0.82;

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="pr.step1.title"
        stepKeyHint="pr.step1.hint"
        remaining={remaining}
        total={10000}
        mood={ready ? 'cheering' : 'idle'}
        moodValue={smooth * 72 - 26}
      />
      <div ref={ref} className="absolute inset-0 flex touch-none flex-col items-center justify-end px-4 pb-24 pt-28">
        <div className="relative mb-4 w-full max-w-sm">
          <div
            className={`mx-auto transition-transform duration-100 ${ready ? 'target-flash' : ''}`}
            style={{
              width: `${70 + smooth * 24}%`,
              transform: `scaleY(${1 - smooth * 0.1}) rotate(${smooth * 3}deg)`,
            }}
          >
            <img
              src={DOUGH_BALL}
              alt=""
              draggable={false}
              className="food-breathe w-full select-none object-contain pointer-events-none drop-shadow-[0_18px_18px_rgba(58,45,36,0.26)]"
              style={{ imageRendering: 'auto' }}
            />
          </div>
          <div className="absolute inset-x-16 top-[40%] h-8 rounded-full bg-white/20 blur-sm" />
        </div>
        <ProgressCard
          label={ready ? 'RELEASE' : 'KNEAD CIRCLES'}
          value={smooth}
          hint={ready ? 'Dough is smooth' : 'Rub circles over the dough'}
        />
      </div>
    </>
  );
}

function SlapStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'slap', durationMs: 10500, onComplete, dishId: DISH });
  const ref = useRef<HTMLDivElement>(null);
  const lastX = useRef<number | null>(null);
  const lastDir = useRef(0);
  const thinnessRef = useRef(0);
  const touched = useRef(false);
  const [thinness, setThinness] = useState(0);
  const [slaps, setSlaps] = useState(0);

  const finishIfReady = (value: number) => {
    if (value < 0.86) return;
    finish(scoreFromBands(value, 0.92, 0.74, 0.48), value);
  };

  usePointer(ref, (e) => {
    if (e.type === 'down') {
      touched.current = true;
      lastX.current = e.x;
      return;
    }
    if (e.type === 'up' || e.type === 'cancel') {
      const value = thinnessRef.current;
      lastX.current = null;
      lastDir.current = 0;
      finishIfReady(value);
      return;
    }
    if (e.type !== 'move' || lastX.current === null) return;

    const dx = e.x - lastX.current;
    if (Math.abs(dx) > 28) {
      const dir = Math.sign(dx);
      const bonus = dir !== lastDir.current ? 0.062 : 0.035;
      setThinness((v) => {
        const next = clamp(v + bonus, 0, 1);
        thinnessRef.current = next;
        return next;
      });
      setSlaps((n) => n + 1);
      sfx.thud();
      lastX.current = e.x;
      lastDir.current = dir;
    }
  });

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = touched.current ? scoreFromBands(thinness, 0.92, 0.74, 0.48) : 'miss';
    finish(tier, thinness);
  }, [remaining, thinness, finish]);

  const ready = thinness >= 0.86;

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="pr.step2.title"
        stepKeyHint="pr.step2.hint"
        remaining={remaining}
        total={10500}
        mood={ready ? 'cheering' : 'idle'}
      />
      <div ref={ref} className="absolute inset-0 flex touch-none flex-col items-center justify-end px-4 pb-24 pt-28">
        <div className="relative mb-7 grid w-full max-w-md place-items-center">
          <div className="absolute h-20 w-[86%] rounded-full bg-outline/15 blur-sm" />
          <img
            src={DOUGH_SHEET}
            alt=""
            draggable={false}
            className={`relative w-full select-none object-contain pointer-events-none ${slaps % 2 ? 'cook-jiggle' : 'food-breathe'} ${ready ? 'target-flash' : ''}`}
            style={{
              imageRendering: 'auto',
              transform: `scaleX(${0.82 + thinness * 0.24}) scaleY(${1 - thinness * 0.12})`,
            }}
          />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 flex -translate-y-1/2 justify-between text-4xl font-black text-white/55">
            <span>&lt;</span>
            <span>&gt;</span>
          </div>
        </div>
        <ProgressCard
          label={ready ? 'RELEASE' : 'SLAP LEFT-RIGHT'}
          value={thinness}
          hint={ready ? 'Thin enough to toss' : 'Swipe across the dough'}
        />
      </div>
    </>
  );
}

function FlickStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'flick', onComplete, dishId: DISH, durationMs: 16000 });
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const flightStart = useRef(0);
  const goodFlips = useRef(0);
  const [phase, setPhase] = useState<'idle' | 'flying' | 'caught'>('idle');
  const [flipsDone, setFlipsDone] = useState(0);
  const [catchT, setCatchT] = useState(0);
  const flipsRequired = 3;

  const settleFlip = (good: boolean) => {
    if (phase !== 'flying') return;
    if (good) {
      goodFlips.current += 1;
      sfx.chime();
    } else {
      sfx.error();
    }
    setPhase('caught');
    setTimeout(() => {
      setFlipsDone((f) => f + 1);
      setCatchT(0);
      setPhase('idle');
    }, 260);
  };

  const startFlip = () => {
    if (phase !== 'idle' || flipsDone >= flipsRequired) return;
    flightStart.current = performance.now();
    setCatchT(0);
    setPhase('flying');
    sfx.snap();
  };

  const catchFlip = () => {
    if (phase !== 'flying') return;
    const t = (performance.now() - flightStart.current) / 1300;
    settleFlip(t >= 0.62 && t <= 1.16);
  };

  usePointer(ref, (e) => {
    if (e.type === 'down') startY.current = e.y;
    if (e.type === 'up' && startY.current !== null) {
      const dy = e.y - startY.current;
      if (dy < -38) startFlip();
      startY.current = null;
    }
    if (e.type === 'cancel') startY.current = null;
  });

  useEffect(() => {
    if (phase !== 'flying') return;
    let raf = 0;
    const loop = () => {
      const t = (performance.now() - flightStart.current) / 1300;
      setCatchT(t);
      if (t >= 1.25) {
        settleFlip(false);
      } else {
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (remaining > 0 || flipsDone >= flipsRequired) return;
    const ratio = goodFlips.current / flipsRequired;
    const tier: ScoreTier = ratio >= 0.66 ? 'silver' : ratio > 0 ? 'bronze' : 'miss';
    finish(tier, ratio);
  }, [remaining, flipsDone, finish]);

  useEffect(() => {
    if (flipsDone < flipsRequired) return;
    const ratio = goodFlips.current / flipsRequired;
    const tier: ScoreTier = ratio >= 0.85 ? 'gold' : ratio >= 0.5 ? 'silver' : 'bronze';
    finish(tier, ratio);
  }, [flipsDone, finish]);

  const inWindow = phase === 'flying' && catchT >= 0.62 && catchT <= 1.16;
  const flight = phase === 'flying' ? catchT : 0;
  const yOff = phase === 'flying' ? -185 * Math.sin(Math.min(1, flight) * Math.PI) : 0;
  const xOff = phase === 'flying' ? Math.sin(flight * Math.PI * 3) * 14 : 0;
  const rotation = phase === 'flying' ? flight * 680 : phase === 'caught' ? 12 : 0;
  const meter = clamp(catchT / 1.25, 0, 1);

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="pr.step3.title"
        stepKeyHint="pr.step3.hint"
        remaining={remaining}
        total={16000}
        mood={inWindow ? 'cheering' : 'idle'}
      />
      <div className="absolute inset-0 px-4 pb-20 pt-28">
        <div ref={ref} className="absolute bottom-28 left-0 right-0 top-28 z-10 touch-none" />
        <div className="absolute left-1/2 top-[54%] h-36 w-[92%] max-w-sm -translate-x-1/2 rounded-[50%] border-[12px] border-[#2f2723] bg-[#61514a] shadow-[0_18px_22px_rgba(58,45,36,0.32)]" />
        <div className="absolute left-1/2 top-[54%] h-24 w-[70%] max-w-xs -translate-x-1/2 rounded-[50%] bg-black/22" />
        <SteamWisps className="left-20 right-20 top-36 bottom-72" count={3} />
        <img
          src={DOUGH_SHEET}
          alt=""
          draggable={false}
          className={`absolute left-1/2 top-[50%] w-[86%] max-w-sm select-none object-contain pointer-events-none ${inWindow ? 'target-flash' : ''}`}
          style={{
            imageRendering: 'auto',
            transform: `translate(calc(-50% + ${xOff}px), calc(-50% + ${yOff}px)) rotate(${rotation}deg) scale(${phase === 'flying' ? 0.88 : 0.78})`,
            transition: phase === 'idle' ? 'transform 140ms ease-out' : undefined,
          }}
        />
        <div className="surface absolute bottom-32 left-1/2 z-20 w-[86%] max-w-xs -translate-x-1/2 px-4 py-3">
          <div className="mb-2 flex justify-between text-xs font-black text-outline/70">
            <span>{inWindow ? 'CATCH NOW' : phase === 'flying' ? 'WATCH METER' : 'FLICK UP'}</span>
            <span>{flipsDone}/{flipsRequired}</span>
          </div>
          <div className="relative h-[15px] border-2 border-outline bg-[#fff7d7]">
            <div className="absolute left-[50%] top-0 h-full w-[43%] bg-pandan/55" />
            <div className="absolute top-[-4px] h-[19px] w-2 bg-sambal" style={{ left: `calc(${meter * 100}% - 4px)` }} />
          </div>
        </div>
        <div className="absolute bottom-14 left-0 right-0 z-20 flex justify-center gap-3">
          <button className="btn-ghost thumb-target min-w-[120px]" onClick={startFlip} disabled={phase !== 'idle'}>
            Flick
          </button>
          <button
            className={`btn-primary thumb-target min-w-[120px] ${inWindow ? 'target-flash' : ''}`}
            onClick={catchFlip}
            disabled={phase !== 'flying'}
          >
            Catch
          </button>
        </div>
      </div>
    </>
  );
}

function FoldStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const [folded, setFolded] = useState(0);
  const allDone = folded >= 4;

  useEffect(() => {
    if (!allDone) return;
    const id = setTimeout(() => onComplete({ stepId: 'fold', tier: 'gold', rawScore: 1, durationMs: 0 }), 760);
    return () => clearTimeout(id);
  }, [allDone, onComplete]);

  const foldCorner = (idx: number) => {
    if (folded !== idx) return;
    sfx.snap();
    setFolded((v) => v + 1);
  };

  const corners = [
    { label: 'top left', className: 'left-0 top-2' },
    { label: 'top right', className: 'right-0 top-2' },
    { label: 'bottom left', className: 'bottom-8 left-0' },
    { label: 'bottom right', className: 'bottom-8 right-0' },
  ];

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="pr.step4.title" stepKeyHint="pr.step4.hint" mood={allDone ? 'tasting' : 'idle'} />
      <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-20 pt-28">
        <div className="relative mb-6 grid h-[420px] w-full max-w-sm place-items-center">
          <div className="absolute bottom-20 h-16 w-[80%] rounded-full bg-outline/15 blur-sm" />
          <img
            src={DOUGH_SHEET}
            alt=""
            draggable={false}
            className={`absolute w-[92%] select-none object-contain pointer-events-none transition-all duration-300 ${allDone ? 'opacity-0 scale-75' : 'opacity-100'} ${folded > 0 ? 'cook-jiggle' : 'food-breathe'}`}
            style={{
              imageRendering: 'auto',
              transform: `rotate(${folded * 7}deg) scale(${1 - folded * 0.08})`,
            }}
          />
          <img
            src={PRATA_PLATE}
            alt=""
            draggable={false}
            className={`absolute w-full select-none object-contain pointer-events-none transition-all duration-500 ${allDone ? 'opacity-100 scale-100 food-breathe' : 'opacity-0 scale-90'}`}
            style={{ imageRendering: 'auto' }}
          />
          {!allDone && corners.map((corner, i) => (
            <button
              key={corner.label}
              aria-label={`fold corner ${i + 1}`}
              disabled={folded !== i}
              onClick={() => foldCorner(i)}
              className={`surface thumb-target absolute grid h-16 w-16 place-items-center text-xl font-black transition-transform active:translate-y-1 ${corner.className} ${folded === i ? 'target-flash' : 'opacity-45'}`}
            >
              {i + 1}
            </button>
          ))}
          <BubbleLayer className="left-16 right-16 top-28 bottom-28" count={allDone ? 8 : 0} />
        </div>
        <div className="surface w-full max-w-xs px-4 py-3 text-center">
          <div className="text-xs font-black text-outline/70">{allDone ? 'SERVE' : 'TAP CORNERS'}</div>
          <div className="mt-2 text-[10px] font-black text-outline/55">{folded}/4 folded</div>
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
