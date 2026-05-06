// Dish 4 — Chili Crab.
// Signature: slow circular drag (egg ribbons) with speed-band ring.

import { useEffect, useRef, useState } from 'react';
import type { DishResult, ScoreTier, StepResult } from '../../../types';
import { DishRunner } from '../../engine/DishRunner';
import { HUD } from '../../engine/HUD';
import { useStep } from '../../engine/useStep';
import { sfx } from '../../../audio/audio';
import { usePointer, dist, clamp, clientToSvg } from '../../engine/gestureHelpers';
import { FoodDefs, IllustratedPlate, type FoodKind } from '../../../art/FoodIllustrations';
import { PixelIcon, PixelIconSvg } from '../../../art/PixelFood';

const DISH = 'chili-crab';

function SambalStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'sambal', durationMs: 9000, onComplete, dishId: DISH });
  const [count, setCount] = useState(0);
  const [last, setLast] = useState<'L' | 'R' | null>(null);

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = count >= 40 ? 'gold' : count >= 28 ? 'silver' : count >= 14 ? 'bronze' : 'miss';
    finish(tier, count / 50);
  }, [remaining, count, finish]);

  const tap = (s: 'L' | 'R') => {
    if (s === last) { sfx.error(); return; }
    sfx.thud(); setCount(c => c + 1); setLast(s);
  };

  const heat = clamp(count / 30, 0, 1);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="cc.step1.title" stepKeyHint="cc.step1.hint" remaining={remaining} total={9000} mood={count > 28 ? 'cheering' : 'idle'} moodValue={heat * 60} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <svg viewBox="0 0 220 200" className="w-[80%] max-w-[420px] pixel-art" shapeRendering="crispEdges">
          <FoodDefs />
          <ellipse cx="110" cy="164" rx="86" ry="16" fill="rgba(58,45,36,0.24)" />
          <path d="M34 104 Q30 156 110 170 Q190 156 186 104 Z" fill="#7C6857" stroke="#3A2D24" strokeWidth="3" />
          <ellipse cx="110" cy="105" rx="82" ry="24" fill="#3A2D24" />
          <ellipse cx="110" cy="101" rx="76" ry="20" fill="#8A7663" />
          <ellipse cx="110" cy="102" rx={34 + count * 0.9} ry={9 + heat * 8} fill="#D8432B" opacity={0.48 + heat * 0.52} />
          <path d="M70 99 Q110 85 151 100" stroke="#FFB09D" strokeWidth="3" fill="none" opacity="0.45" />
          {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
            <circle key={i} cx={70 + i * 7} cy={116 + Math.sin(i) * 10} r="2" fill="#D8432B" opacity="0.6" />
          ))}
          <rect x="101" y="28" width="18" height="78" rx="8" fill="#5A4A42" stroke="#3A2D24" strokeWidth="3" />
          <ellipse cx="110" cy="28" rx="18" ry="8" fill="#6B5A50" stroke="#3A2D24" strokeWidth="2" />
        </svg>
        <div className="text-3xl font-display font-bold mt-2">{count}</div>
        <div className="flex gap-3 mt-3">
          <button className={`pixel-token thumb-target h-32 w-32 text-2xl font-bold ${last === 'L' ? 'bg-sambal text-white' : ''}`} onClick={() => tap('L')}>←</button>
          <button className={`pixel-token thumb-target h-32 w-32 text-2xl font-bold ${last === 'R' ? 'bg-sambal text-white' : ''}`} onClick={() => tap('R')}>→</button>
        </div>
      </div>
    </>
  );
}

function SearStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'sear', durationMs: 8000, onComplete, dishId: DISH });
  const joints = [
    { x: 100, y: 200 }, { x: 250, y: 180 }, { x: 80, y: 320 }, { x: 280, y: 320 },
    { x: 175, y: 130 }, { x: 175, y: 380 },
  ];
  const [activeIdx, setActiveIdx] = useState(0);
  const [hits, setHits] = useState(0);

  useEffect(() => {
    if (activeIdx >= joints.length) {
      const tier: ScoreTier = hits === joints.length ? 'gold' : hits >= 4 ? 'silver' : hits >= 2 ? 'bronze' : 'miss';
      finish(tier, hits / joints.length);
    }
  }, [activeIdx, hits, finish, joints.length]);

  // pulse advance every 1s if not tapped
  useEffect(() => {
    if (remaining === 0) return;
    if (activeIdx >= joints.length) return;
    const t = setTimeout(() => setActiveIdx((i) => i + 1), 1100);
    return () => clearTimeout(t);
  }, [activeIdx, remaining, joints.length]);

  const tapJoint = (i: number) => {
    if (i === activeIdx) {
      sfx.snap();
      setHits((h) => h + 1);
      setActiveIdx((j) => j + 1);
    } else {
      sfx.error();
    }
  };

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="cc.step2.title" stepKeyHint="cc.step2.hint" remaining={remaining} total={8000} mood="tutorial_pointing" />
      <div className="absolute inset-0 touch-none">
        <svg viewBox="0 0 360 460" className="h-full w-full pixel-art" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
          <FoodDefs />
          <IllustratedPlate x={180} y={270} rx={130} ry={42} />
          <g transform="translate(125, 180) scale(1.1)">
            <PixelIcon kind="crab" size={100} />
          </g>
          {/* joints */}
          {joints.map((j, i) => (
            <g key={i} onClick={() => tapJoint(i)} style={{ cursor: 'pointer' }}>
              <circle cx={j.x} cy={j.y} r={i === activeIdx ? 22 : 16} fill={i < activeIdx ? '#6FB552' : i === activeIdx ? '#E8B83A' : '#3A2D2444'} stroke="#3A2D24" strokeWidth="3" className={i === activeIdx ? 'animate-pulse' : ''} />
            </g>
          ))}
        </svg>
      </div>
    </>
  );
}

// Step 3: Egg ribbons — slow circular drag with speed band
function EggRibbonStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'egg_ribbon', durationMs: 7000, onComplete, dishId: DISH });
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const center = { x: 180, y: 230 }; // viewBox coords
  const lastAngle = useRef<number | null>(null);
  const lastT = useRef(performance.now());
  const [ribbonPts, setRibbonPts] = useState<{ x: number; y: number }[]>([]);
  const inBandTime = useRef(0);
  const totalTime = useRef(0);
  const [speed, setSpeed] = useState(0);

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
      const omega = Math.abs(da) / (dt / 1000);
      setSpeed(omega);
      totalTime.current += dt;
      // target band: slow — 1.5–3 rad/s
      if (omega >= 1.5 && omega <= 3) inBandTime.current += dt;
      // record ribbon point if in-ish-band (in viewBox coords)
      if (omega >= 1 && omega <= 4) {
        setRibbonPts((p) => [...p.slice(-200), { x: vb.x, y: vb.y }]);
      }
    }
    lastAngle.current = angle;
    lastT.current = now;
  });

  useEffect(() => {
    if (remaining > 0) return;
    const ratio = totalTime.current > 0 ? inBandTime.current / totalTime.current : 0;
    const tier: ScoreTier = ratio >= 0.7 ? 'gold' : ratio >= 0.45 ? 'silver' : ratio >= 0.2 ? 'bronze' : 'miss';
    finish(tier, ratio);
  }, [remaining, finish]);

  const inBand = speed >= 1.5 && speed <= 3;

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="cc.step3.title" stepKeyHint="cc.step3.hint" remaining={remaining} total={7000} mood={inBand ? 'tasting' : 'worried'} moodValue={inBand ? 40 : -30} />
      <div className="absolute inset-0 grid place-items-center pt-28 pb-20 px-2">
        <div ref={ref} className="relative w-full max-w-full max-h-full aspect-[360/460] touch-none">
          <svg ref={svgRef} viewBox="0 0 360 460" className="absolute inset-0 h-full w-full pixel-art" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
            <FoodDefs />
            <ellipse cx={center.x} cy={center.y + 84} rx="148" ry="18" fill="rgba(58,45,36,0.25)" />
            <path d={`M ${center.x - 138} ${center.y - 4} Q ${center.x - 154} ${center.y + 74} ${center.x} ${center.y + 86} Q ${center.x + 154} ${center.y + 74} ${center.x + 138} ${center.y - 4} Z`} fill="url(#fi-wok)" stroke="#1B1A1A" strokeWidth="3" />
            <ellipse cx={center.x} cy={center.y - 6} rx="120" ry="78" fill="#A93521" stroke="#3A2D24" strokeWidth="2" />
            <ellipse cx={center.x} cy={center.y - 10} rx="112" ry="70" fill="#D8432B" />
            <path d={`M ${center.x - 76} ${center.y - 18} Q ${center.x} ${center.y - 52} ${center.x + 76} ${center.y - 18}`} stroke="#FF9B7C" strokeWidth="4" fill="none" opacity="0.42" />
            <circle cx={center.x} cy={center.y} r="80" fill="none" stroke={inBand ? '#E8B83A' : '#3A2D2455'} strokeWidth="4" strokeDasharray="6 6" />
            <polyline
              points={ribbonPts.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#FFE9A0"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-3 left-0 right-0 text-center text-xs pointer-events-none">
        {inBand ? '✓ slow circles' : speed > 3 ? 'too fast' : 'too slow'}
      </div>
    </>
  );
}

function PlateCrab({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const items: { kind: FoodKind; label: string; x: number; y: number; size: number }[] = [
    { kind: 'crab', label: 'crab', x: 142, y: 178, size: 86 },
    { kind: 'mantou', label: 'mantou', x: 216, y: 202, size: 58 },
  ];
  const [placed, setPlaced] = useState<boolean[]>([false, false]);
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number; vbX: number; vbY: number; idx: number | null }>({ x: 0, y: 0, vbX: 0, vbY: 0, idx: null });
  const target = { x: 180, y: 220 };

  usePointer(ref, (e) => {
    const vb = clientToSvg(svgRef.current, e.raw.clientX, e.raw.clientY);
    if (e.type === 'down') {
      const idx = items.findIndex((_, i) => !placed[i]);
      if (idx >= 0) setPos({ x: e.x, y: e.y, vbX: vb.x, vbY: vb.y, idx });
    } else if (e.type === 'move' && pos.idx !== null) {
      setPos({ ...pos, x: e.x, y: e.y, vbX: vb.x, vbY: vb.y });
    } else if (e.type === 'up' && pos.idx !== null) {
      if (dist(vb.x, vb.y, target.x, target.y) < 100) {
        sfx.snap();
        const idx = pos.idx;
        setPlaced((p) => p.map((v, i) => (i === idx ? true : v)));
      }
      setPos({ x: 0, y: 0, vbX: 0, vbY: 0, idx: null });
    }
  });

  useEffect(() => {
    if (placed.every(Boolean)) {
      const id = setTimeout(() => onComplete({ stepId: 'plate', tier: 'gold', rawScore: 1, durationMs: 0 }), 300);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [placed, onComplete]);

  return (
    <>
      <HUD dishId={DISH} stepKeyTitle="cc.step4.title" stepKeyHint="cc.step4.hint" mood={placed.every(Boolean) ? 'tasting' : 'idle'} />
      <div className="absolute inset-0 grid place-items-center pt-28 pb-24 px-2">
        <div ref={ref} className="relative w-full max-w-full max-h-full aspect-[360/460] touch-none">
          <svg ref={svgRef} viewBox="0 0 360 460" className="absolute inset-0 h-full w-full pixel-art" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
            <FoodDefs />
            <IllustratedPlate x={target.x} y={target.y} rx={124} ry={38} />
            <ellipse cx={target.x} cy={target.y - 7} rx="88" ry="24" fill="#D8432B" opacity="0.2" />
            {placed.map((p, i) => p && <PixelIcon key={i} kind={items[i].kind} x={items[i].x - items[i].size / 2} y={items[i].y - items[i].size / 2} size={items[i].size} />)}
          </svg>
          {pos.idx !== null && (
            <div className="absolute pointer-events-none" style={{ left: pos.x - 30, top: pos.y - 30 }}>
              <PixelIconSvg kind={items[pos.idx].kind} size={64} title={items[pos.idx].label} />
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-3 pointer-events-none">
        {items.map((it, i) => (
          <div key={i} className={`pixel-token h-14 w-14 ${placed[i] ? 'opacity-40' : ''}`}>
            <PixelIconSvg kind={it.kind} size={44} title={it.label} />
          </div>
        ))}
      </div>
    </>
  );
}

const STEPS = [
  { id: 'sambal', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <SambalStep onComplete={onComplete} /> },
  { id: 'sear', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <SearStep onComplete={onComplete} /> },
  { id: 'egg_ribbon', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <EggRibbonStep onComplete={onComplete} /> },
  { id: 'plate', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <PlateCrab onComplete={onComplete} /> },
];

export default function ChiliCrab({ onComplete, onExit }: { onComplete: (r: DishResult) => void; onExit: () => void }) {
  return <DishRunner dishId="chili-crab" steps={STEPS} onComplete={onComplete} onExit={onExit} />;
}
