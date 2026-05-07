// Dish 2 - Katong Laksa.

import { useEffect, useRef, useState } from 'react';
import type { DishResult, ScoreTier, StepResult } from '../../../types';
import { BubbleLayer, SteamWisps } from '../../../art/GameFX';
import { FoodIconSvg, type FoodKind } from '../../../art/FoodIllustrations';
import { DishRunner } from '../../engine/DishRunner';
import { HUD } from '../../engine/HUD';
import { useStep } from '../../engine/useStep';
import { useT } from '../../../i18n/useT';
import { sfx } from '../../../audio/audio';
import { usePointer, dist, clamp, clientToSvg } from '../../engine/gestureHelpers';
import { scoreFromBands } from '../../engine/scoring';

const DISH = 'laksa';
const ASSET_BASE = (import.meta.env.BASE_URL as string) ?? '/';
const LAKSA_FINISHED = `${ASSET_BASE}assets/gameplay/laksa-bowl-700.webp`;
const LAKSA_BASE = `${ASSET_BASE}assets/gameplay/laksa-noodle-broth-700.webp`;

function BloomStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'bloom', durationMs: 9000, onComplete, dishId: DISH });
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastAngle = useRef<number | null>(null);
  const lastT = useRef(performance.now());
  const touched = useRef(false);
  const bloomRef = useRef(0);
  const center = { x: 180, y: 230 };
  const [bloom, setBloom] = useState(0);
  const [speed, setSpeed] = useState(0);

  usePointer(ref, (e) => {
    if (e.type === 'up' || e.type === 'cancel') {
      const finalBloom = bloomRef.current;
      lastAngle.current = null;
      setSpeed(0);
      if (finalBloom >= 0.96) finish('gold', finalBloom);
      return;
    }
    if (e.type !== 'down' && e.type !== 'move') return;
    touched.current = true;
    const vb = clientToSvg(svgRef.current, e.raw.clientX, e.raw.clientY);
    const angle = Math.atan2(vb.y - center.y, vb.x - center.x);
    const now = performance.now();
    if (e.type === 'down') {
      lastAngle.current = angle;
      lastT.current = now;
      setSpeed(0);
      return;
    }
    if (lastAngle.current !== null) {
      let da = angle - lastAngle.current;
      if (da > Math.PI) da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      const angularVel = Math.abs(da) / (Math.max(1, now - lastT.current) / 1000);
      const norm = clamp(angularVel / 6, 0, 2);
      const inBand = angularVel >= 2.2 && angularVel <= 11;
      setSpeed(norm);
      setBloom((b) => {
        const next = clamp(b + (inBand ? 0.02 : 0.006), 0, 1);
        bloomRef.current = next;
        return next;
      });
      if (inBand && Math.random() < 0.04) sfx.bubble();
    }
    lastAngle.current = angle;
    lastT.current = now;
  });

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = touched.current ? scoreFromBands(bloom, 0.82, 0.54, 0.25) : 'miss';
    finish(tier, bloom);
  }, [remaining, bloom, finish]);

  const inBand = speed >= 0.35 && speed <= 1.85;
  const isReady = bloom >= 0.96;

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="la.step1.title"
        stepKeyHint="la.step1.hint"
        remaining={remaining}
        total={9000}
        mood={bloom > 0.62 ? 'cheering' : 'idle'}
        moodValue={bloom * 80 - 25}
      />
      <div className="absolute inset-0 grid place-items-center px-2 pb-20 pt-28">
        <div ref={ref} className="relative aspect-[360/460] w-full max-w-full touch-none">
          <svg ref={svgRef} viewBox="0 0 360 460" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
            <circle cx={center.x} cy={center.y} r="112" fill="none" stroke={inBand ? '#6FB552' : '#3A2D2455'} strokeWidth="4" strokeDasharray="10 7" />
          </svg>
          <div className="absolute left-1/2 top-[50%] w-[112%] -translate-x-1/2 -translate-y-1/2">
            <img
              src={`${ASSET_BASE}assets/gameplay/laksa-rempah-wok-700.webp`}
              alt=""
              draggable={false}
              className={`heat-shimmer w-full select-none pointer-events-none ${inBand ? 'target-flash' : ''}`}
              style={{ imageRendering: 'auto' }}
            />
            <SteamWisps className="left-20 right-20 top-6 bottom-28" count={4} />
            <BubbleLayer className="left-24 right-24 top-40 bottom-28" count={12} />
          </div>
          <div className="surface absolute bottom-6 left-1/2 w-64 -translate-x-1/2 px-4 py-3">
            <div className="mb-2 flex justify-between text-xs font-black text-outline/70">
              <span>{isReady ? 'LIFT SPOON' : inBand ? 'GOOD STIR' : 'STIR CIRCLES'}</span>
              <span>{Math.round(bloom * 100)}%</span>
            </div>
            <div className="pixel-meter h-[13px] w-full">
              <span style={{ width: `${bloom * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function OrderStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const t = useT();
  const { remaining, finish } = useStep({ stepId: 'order', onComplete, dishId: DISH, durationMs: 10000 });
  const order: { key: 'stock' | 'coconut' | 'taupok'; kind: FoodKind }[] = [
    { key: 'stock', kind: 'stock' },
    { key: 'coconut', kind: 'coconut' },
    { key: 'taupok', kind: 'taupok' },
  ];
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const tap = (key: (typeof order)[number]['key']) => {
    if (step >= order.length) return;
    const expected = order[step].key;
    if (key !== expected) {
      sfx.error();
      setMistakes((n) => n + 1);
      return;
    }
    sfx.snap();
    const next = step + 1;
    setStep(next);
    if (next >= order.length) {
      const tier: ScoreTier = mistakes === 0 ? 'gold' : mistakes <= 1 ? 'silver' : 'bronze';
      finish(tier, mistakes === 0 ? 1 : 0.68);
    }
  };

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = step >= 3 ? (mistakes ? 'silver' : 'gold') : step >= 2 ? 'silver' : step >= 1 ? 'bronze' : 'miss';
    finish(tier, step / 3);
  }, [remaining, step, mistakes, finish]);

  const nextKey = order[Math.min(step, order.length - 1)].key;

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="la.step2.title" stepKeyHint="la.step2.hint" remaining={remaining} total={10000} mood={mistakes ? 'worried' : 'tutorial_pointing'} />
      <div className="absolute inset-0 flex flex-col items-center justify-end gap-4 px-4 pb-16 pt-28">
        <div className="surface relative w-full max-w-sm overflow-hidden px-4 py-3 text-center">
          <div className="relative mx-auto h-48">
            <img
              src={LAKSA_BASE}
              alt=""
              draggable={false}
              className="food-breathe absolute inset-0 h-full w-full select-none object-contain opacity-90"
              style={{ imageRendering: 'auto' }}
            />
            <BubbleLayer className="left-16 right-16 top-16 bottom-16" count={8} />
          </div>
          <div className="mt-1 text-xs font-black uppercase text-sambal">
            {step >= order.length ? 'BROTH READY' : `NEXT: ${t(`la.step2.${nextKey}`)}`}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {order.map((item, i) => (
              <button
                key={item.key}
                onClick={() => tap(item.key)}
                disabled={i < step}
                className={`surface thumb-target px-2 py-2 text-center transition-transform active:translate-y-1 ${i === step ? 'target-flash' : ''} ${i < step ? 'opacity-55' : ''}`}
              >
                <FoodIconSvg kind={item.kind} size={56} title={t(`la.step2.${item.key}`)} />
                <div className="mt-1 text-[10px] font-black leading-tight">{t(`la.step2.${item.key}`)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function NoodleStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'noodle', onComplete, dishId: DISH, durationMs: 9000 });
  const [holding, setHolding] = useState(false);
  const [held, setHeld] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!holding) return;
    startRef.current = performance.now();
    let raf = 0;
    const loop = () => {
      if (startRef.current !== null) setHeld(performance.now() - startRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [holding]);

  const release = () => {
    if (!holding) return;
    setHolding(false);
    const ms = held;
    const tier: ScoreTier = ms >= 2600 && ms <= 4600 ? 'gold' : ms >= 1800 && ms <= 5600 ? 'silver' : ms >= 900 ? 'bronze' : 'miss';
    finish(tier, ms >= 2600 && ms <= 4600 ? 1 : 0.55);
  };

  useEffect(() => {
    if (remaining > 0) return;
    finish(held >= 900 ? 'bronze' : 'miss', 0.3);
  }, [remaining, held, finish]);

  const pct = clamp(held / 4600, 0, 1);
  const inWindow = held >= 2600 && held <= 4600;

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="la.step3.title" stepKeyHint="la.step3.hint" remaining={remaining} total={9000} mood={inWindow ? 'cheering' : 'idle'} />
      <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-14 pt-28">
        <div className="relative w-full max-w-sm">
          <img
            src={`${ASSET_BASE}assets/gameplay/laksa-noodle-basket-700.webp`}
            alt=""
            draggable={false}
            className={`w-full select-none pointer-events-none ${holding ? 'cook-jiggle' : 'food-breathe'} ${inWindow ? 'target-flash' : ''}`}
            style={{ imageRendering: 'auto' }}
          />
          <SteamWisps className="left-20 right-16 top-0 bottom-40" count={4} />
        </div>
        <div className="surface mt-2 w-full max-w-xs px-4 py-3">
          <div className="mb-2 flex justify-between text-xs font-black text-outline/70">
            <span>{inWindow ? 'LIFT NOW' : holding ? 'BLANCHING' : 'HOLD'}</span>
            <span>{(held / 1000).toFixed(1)}s</span>
          </div>
          <div className="pixel-meter h-[13px] w-full">
            <span style={{ width: `${pct * 100}%` }} />
          </div>
        </div>
        <button
          className={`btn-primary mt-4 min-w-[190px] thumb-target ${inWindow ? 'target-flash' : ''}`}
          onPointerDown={() => {
            setHeld(0);
            setHolding(true);
          }}
          onPointerUp={release}
          onPointerCancel={release}
        >
          {inWindow ? 'Release!' : holding ? 'Hold...' : 'Hold to blanch'}
        </button>
      </div>
    </>
  );
}

function GarnishStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const t = useT();
  const items: { kind: FoodKind; label: string; tokenX: number; tokenY: number; mask: string }[] = [
    { kind: 'prawn', label: 'prawn', tokenX: 68, tokenY: 405, mask: 'radial-gradient(ellipse 24% 18% at 36% 55%, #000 64%, transparent 100%)' },
    { kind: 'fishcake', label: 'fishcake', tokenX: 151, tokenY: 405, mask: 'radial-gradient(ellipse 18% 13% at 75% 37%, #000 66%, transparent 100%)' },
    { kind: 'sprouts', label: 'sprouts', tokenX: 235, tokenY: 405, mask: 'radial-gradient(ellipse 13% 13% at 52% 39%, #000 62%, transparent 100%)' },
    { kind: 'sambal', label: 'sambal', tokenX: 318, tokenY: 405, mask: 'radial-gradient(ellipse 12% 11% at 70% 56%, #000 64%, transparent 100%)' },
  ];
  const [placed, setPlaced] = useState<boolean[]>([false, false, false, false]);
  const [dragging, setDragging] = useState<{ idx: number; x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const target = { x: 180, y: 235 };

  usePointer(ref, (e) => {
    const vb = clientToSvg(svgRef.current, e.raw.clientX, e.raw.clientY);
    if (e.type === 'down') {
      const idx = items.findIndex((item, i) => !placed[i] && dist(vb.x, vb.y, item.tokenX, item.tokenY) < 48);
      if (idx >= 0) setDragging({ idx, x: e.x, y: e.y });
    } else if (e.type === 'move' && dragging) {
      setDragging({ ...dragging, x: e.x, y: e.y });
    } else if (e.type === 'up' && dragging) {
      if (dist(vb.x, vb.y, target.x, target.y) < 112) {
        sfx.snap();
        const idx = dragging.idx;
        setPlaced((p) => p.map((v, i) => (i === idx ? true : v)));
      }
      setDragging(null);
    }
  });

  const allDone = placed.every(Boolean);
  useEffect(() => {
    if (!allDone) return;
    const id = setTimeout(() => {
      onComplete({ stepId: 'garnish', tier: 'gold', rawScore: 1, durationMs: 0 });
    }, 360);
    return () => clearTimeout(id);
  }, [allDone, onComplete]);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="la.step4.title" stepKeyHint="la.step4.hint" mood={allDone ? 'tasting' : 'idle'} />
      <div ref={ref} className="absolute inset-0 touch-none px-3 pb-20 pt-28">
        <svg ref={svgRef} viewBox="0 0 360 460" className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
          <ellipse cx={target.x} cy={target.y + 60} rx="128" ry="18" fill="rgba(58,45,36,0.18)" />
        </svg>
        <div className="absolute left-1/2 top-[43%] w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2">
          <div className={`relative aspect-[760/573] w-full ${dragging ? 'target-flash' : ''}`}>
            <img
              src={LAKSA_BASE}
              alt=""
              draggable={false}
              className="food-breathe absolute inset-0 h-full w-full select-none object-fill pointer-events-none"
              style={{ imageRendering: 'auto' }}
            />
            {items.map((item, i) => (
              placed[i] && !allDone ? (
                <img
                  key={item.label}
                  src={LAKSA_FINISHED}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full select-none object-fill pointer-events-none transition-opacity duration-300"
                  style={{ WebkitMaskImage: item.mask, maskImage: item.mask, imageRendering: 'auto' }}
                />
              ) : null
            ))}
            <img
              src={LAKSA_FINISHED}
              alt=""
              draggable={false}
              className={`absolute inset-0 h-full w-full select-none object-fill pointer-events-none transition-opacity duration-300 ${allDone ? 'opacity-100 food-breathe' : 'opacity-0'}`}
              style={{ imageRendering: 'auto' }}
            />
          </div>
        </div>
        <div className="surface absolute bottom-14 left-3 right-3 px-3 py-3">
          <div className="mb-2 flex items-center justify-between text-xs font-black text-outline/70">
            <span>{allDone ? 'READY' : 'DRAG TOPPINGS'}</span>
            <span>{placed.filter(Boolean).length}/4</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {items.map((it, i) => (
              <div key={it.label} className={`grid h-16 place-items-center border-2 border-outline/35 bg-[#fff7d7]/75 ${placed[i] ? 'opacity-45' : ''}`}>
                <FoodIconSvg kind={it.kind} size={48} title={it.label} />
              </div>
            ))}
          </div>
        </div>
        {dragging && (
          <div className="pointer-events-none absolute z-20" style={{ left: dragging.x - 32, top: dragging.y - 32 }}>
            <FoodIconSvg kind={items[dragging.idx].kind} size={64} title={items[dragging.idx].label} />
          </div>
        )}
      </div>
      <div className="sr-only">{t('la.step4.hint')}</div>
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
