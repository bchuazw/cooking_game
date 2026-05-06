// Dish 1 — Hainanese Chicken Rice (tutorial dish).
// All 5 steps per brief §5.

import { useEffect, useRef, useState } from 'react';
import type { DishResult, ScoreTier, StepResult } from '../../../types';
import { DishRunner } from '../../engine/DishRunner';
import { HUD } from '../../engine/HUD';
import { useStep } from '../../engine/useStep';
import { useT } from '../../../i18n/useT';
import { sfx } from '../../../audio/audio';
import { usePointer, clamp, dist, clientToSvg, clientToCanvas } from '../../engine/gestureHelpers';
import { scoreFromBands } from '../../engine/scoring';
import { FoodIconSvg } from '../../../art/FoodIllustrations';

const DISH = 'chicken-rice';

// ---------- Step 1: Poach (slider thermometer) ----------
function PoachStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({
    stepId: 'poach',
    durationMs: 12000,
    onComplete,
    dishId: DISH,
  });
  const [temp, setTemp] = useState(80); // °C, target 75–85
  const [knob, setKnob] = useState(0.5); // 0..1
  const drift = useRef(0);
  const inGreen = useRef(0);
  const total = useRef(0);
  const lastT = useRef(performance.now());

  // pseudorandom drift
  useEffect(() => {
    const id = setInterval(() => {
      drift.current += (Math.random() - 0.5) * 1.4;
      drift.current = clamp(drift.current, -8, 8);
    }, 220);
    return () => clearInterval(id);
  }, []);

  // tick: update temp from knob - drift, score time-in-band
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const dt = now - lastT.current;
      lastT.current = now;
      // knob 0..1 maps to 65..95 °C
      const target = 65 + knob * 30;
      const next = clamp(target - drift.current, 60, 100);
      setTemp(next);
      total.current += dt;
      if (next >= 75 && next <= 85) inGreen.current += dt;
      // tink on entering band
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [knob]);

  // when timer ends, score
  useEffect(() => {
    if (remaining > 0) return;
    const ratio = total.current > 0 ? inGreen.current / total.current : 0;
    const tier: ScoreTier = scoreFromBands(ratio, 0.85, 0.65, 0.4);
    finish(tier, ratio);
  }, [remaining, finish]);

  // pointer drag controls knob
  const ref = useRef<HTMLDivElement>(null);
  usePointer(ref, (e) => {
    if (e.type === 'down' || e.type === 'move') {
      const r = ref.current!.getBoundingClientRect();
      // knob is vertical; map y to value (top=hot)
      const y = clamp(e.y, 0, r.height);
      const v = 1 - y / r.height;
      setKnob(v);
      sfx.bubble();
    }
  });

  const inBand = temp >= 75 && temp <= 85;
  const t = useT();

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="cr.step1.title"
        stepKeyHint="cr.step1.hint"
        remaining={remaining}
        total={12000}
        mood={inBand ? 'idle' : 'worried'}
        moodValue={inBand ? 30 : -40}
      />

      <div className="absolute inset-0 flex items-end justify-center pb-24">
        {/* Pot */}
        <svg viewBox="0 0 360 320" className="w-[92%] max-w-[460px]">
          <defs>
            <linearGradient id="pot-steel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E5E5E5" />
              <stop offset="50%" stopColor="#A8A8A8" />
              <stop offset="100%" stopColor="#5C5C5C" />
            </linearGradient>
            <linearGradient id="pot-inside" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3A2D24" />
              <stop offset="100%" stopColor="#1B1A1A" />
            </linearGradient>
            <radialGradient id="broth-gradient" cx="0.5" cy="0.45" r="0.6">
              <stop offset="0%" stopColor={inBand ? '#FFE9B0' : temp < 72 ? '#D8E8FF' : '#F2C9A0'} />
              <stop offset="70%" stopColor={inBand ? '#E8B83A' : temp < 72 ? '#8DA9D6' : '#C9925A'} />
              <stop offset="100%" stopColor={inBand ? '#A8772D' : temp < 72 ? '#5A7CA8' : '#7E5022'} />
            </radialGradient>
            <linearGradient id="pot-handle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5A4A42" />
              <stop offset="100%" stopColor="#2D1F18" />
            </linearGradient>
            <radialGradient id="bubble-grad" cx="0.5" cy="0.4" r="0.5">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
            </radialGradient>
          </defs>

          {/* table shadow */}
          <ellipse cx="180" cy="240" rx="160" ry="14" fill="rgba(58,45,36,0.22)" />
          {/* steam wisps */}
          <g opacity="0.55">
            <path d="M 120 80 Q 110 50 130 30 Q 140 10 130 -10" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 180 70 Q 190 40 175 20 Q 160 0 180 -20" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M 240 80 Q 250 50 230 30 Q 220 10 240 -10" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
          </g>
          <g opacity="0.35" stroke="#3A2D24" strokeWidth="1.5" fill="none">
            <path d="M 110 84 q -2 -16 6 -28" />
            <path d="M 175 76 q 2 -16 -2 -28" />
            <path d="M 246 84 q 2 -16 -6 -28" />
          </g>

          {/* handles (sides) */}
          <g transform="translate(40, 145)">
            <ellipse cx="0" cy="0" rx="18" ry="10" fill="url(#pot-handle)" stroke="#1B1A1A" strokeWidth="2" />
            <ellipse cx="-2" cy="-2" rx="13" ry="6" fill="rgba(255,255,255,0.15)" />
          </g>
          <g transform="translate(320, 145)">
            <ellipse cx="0" cy="0" rx="18" ry="10" fill="url(#pot-handle)" stroke="#1B1A1A" strokeWidth="2" />
            <ellipse cx="-2" cy="-2" rx="13" ry="6" fill="rgba(255,255,255,0.15)" />
          </g>

          {/* pot body (sides curving down) */}
          <path d="M 50 120 Q 40 200 80 220 L 280 220 Q 320 200 310 120 Z" fill="url(#pot-steel)" stroke="#1B1A1A" strokeWidth="2" />
          {/* pot vertical brushed-steel hint */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <line key={i} x1={70 + i * 32} y1={130} x2={72 + i * 32} y2={210} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          ))}
          {/* pot rim front */}
          <ellipse cx="180" cy="120" rx="125" ry="20" fill="url(#pot-inside)" stroke="#1B1A1A" strokeWidth="2" />
          <ellipse cx="180" cy="116" rx="120" ry="16" fill="url(#broth-gradient)" />
          {/* broth surface highlight */}
          <ellipse cx="160" cy="110" rx="60" ry="3" fill="rgba(255,255,255,0.45)" />
          {/* aromatics floating: ginger slice */}
          <g transform="translate(105, 116)">
            <ellipse cx="0" cy="0" rx="9" ry="5" fill="#F1C9A4" stroke="#7E5022" strokeWidth="0.6" />
            <path d="M -5 0 q 5 -2 10 0 M -5 1 q 5 -2 10 0" stroke="#7E5022" strokeWidth="0.4" fill="none" />
          </g>
          <g transform="translate(245, 117)">
            <ellipse cx="0" cy="0" rx="7" ry="4" fill="#F1C9A4" stroke="#7E5022" strokeWidth="0.6" />
            <path d="M -4 0 q 4 -1.5 8 0" stroke="#7E5022" strokeWidth="0.4" fill="none" />
          </g>
          {/* scallion strands */}
          <path d="M 90 113 q 6 -1 12 0" stroke="#558D40" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 230 115 q 6 -1 14 0" stroke="#558D40" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* pandan knot */}
          <path d="M 200 110 q -8 -4 0 -10 q 8 -4 0 -10" stroke="#3A6A22" strokeWidth="1.6" fill="none" />

          {/* chicken (whole) submerged */}
          <g transform="translate(180, 117)">
            <ellipse cx="0" cy="0" rx="50" ry="11" fill={temp > 90 ? '#B8A88A' : temp < 72 ? '#F8C5C0' : '#F1C9A4'} stroke="#7B5A3D" strokeWidth="1.5" opacity="0.92" />
            <ellipse cx="0" cy="-2" rx="44" ry="6" fill={temp > 90 ? '#A89F8A' : temp < 72 ? '#FFD8D5' : '#FFE5C8'} opacity="0.7" />
            <path d="M -36 -2 Q 0 -6 36 -2" stroke="#FFE9B0" strokeWidth="2" fill="none" opacity="0.6" />
          </g>

          {/* bubbles */}
          {inBand &&
            [0, 1, 2, 3, 4, 5].map((i) => (
              <circle
                key={i}
                cx={90 + ((Date.now() / 80 + i * 45) % 180)}
                cy={108 + Math.sin((Date.now() / 200 + i) * 0.5) * 4}
                r={3 + (i % 3)}
                fill="url(#bubble-grad)"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.5"
              />
            ))}
        </svg>

        {/* Thermometer slider */}
        <div className="absolute right-3 top-32 bottom-28 flex flex-col items-center">
          <div ref={ref} className="relative w-12 h-full bg-white border-2 border-outline rounded-chip touch-none">
            {/* green band 75–85 in our 65–95 range */}
            <div className="absolute left-0 right-0" style={{
              top: `${((95 - 85) / 30) * 100}%`,
              height: `${(10 / 30) * 100}%`,
              background: '#6FB55244',
              border: '2px dashed #6FB552',
            }} />
            {/* mercury */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-3 bg-sambal rounded-t" style={{
              height: `${((temp - 60) / 40) * 100}%`,
              transition: 'height 80ms linear',
            }} />
            {/* knob */}
            <div className="absolute -left-2 -right-2 h-3 bg-outline rounded" style={{
              top: `${(1 - knob) * 100}%`,
              transition: 'top 80ms linear',
            }} />
          </div>
          <div className="mt-1 text-[11px] font-bold" style={{ color: inBand ? '#558D40' : '#A93521' }}>
            {Math.round(temp)}°C
          </div>
          <div className="text-[10px] text-outline/70">{t('hud.gold').slice(0, 1)}: 75–85</div>
        </div>
      </div>
    </>
  );
}

// ---------- Step 2: Ice bath (drag chicken) ----------
function IceBathStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'ice_bath', onComplete, dishId: DISH, durationMs: 5500 });
  const [pos, setPos] = useState({ x: 100, y: 220 });
  const [held, setHeld] = useState(0); // ms held in bowl
  const [done, setDone] = useState(false);
  const startRef = useRef(performance.now());
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // viewBox: 0 0 360 380 (see render below)
  const bowlX = 260, bowlY = 200, bowlR = 60;
  const overBowl = dist(pos.x, pos.y, bowlX, bowlY) < bowlR;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      if (overBowl && !done) {
        setHeld((h) => {
          const nh = h + dt;
          if (nh >= 500) {
            setDone(true);
            sfx.sizzle();
            const total = performance.now() - startRef.current;
            // brief: gold < 2.5s, silver < 4s, bronze on completion
            const tier: ScoreTier = total < 2500 ? 'gold' : total < 4000 ? 'silver' : 'bronze';
            finish(tier, 1 - clamp(total / 5000, 0, 1));
          }
          return nh;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [overBowl, done, finish]);

  // safety: if timer expires without completion, finish bronze
  useEffect(() => {
    if (remaining === 0 && !done) {
      setDone(true);
      finish('bronze', 0.4);
    }
  }, [remaining, done, finish]);

  usePointer(ref, (e) => {
    if (e.type === 'down' || e.type === 'move') {
      const p = clientToSvg(svgRef.current, e.raw.clientX, e.raw.clientY);
      setPos({ x: p.x, y: p.y });
    }
    if (e.type === 'up' && !overBowl) {
      setHeld(0);
    }
  });

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="cr.step2.title"
        stepKeyHint="cr.step2.hint"
        remaining={remaining}
        total={5500}
        mood={overBowl ? 'cheering' : 'idle'}
      />
      <div ref={ref} className="absolute inset-0 touch-none">
        <svg ref={svgRef} viewBox="0 0 360 380" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* pot (left) */}
          <ellipse cx="100" cy="220" rx="56" ry="14" fill="#3A2D24" />
          <ellipse cx="100" cy="218" rx="54" ry="12" fill="#5FBFB8" />
          {/* ice bowl (right) */}
          <ellipse cx={bowlX} cy={bowlY} rx={bowlR} ry={20} fill="#3A2D24" />
          <ellipse cx={bowlX} cy={bowlY - 2} rx={bowlR - 2} ry={18} fill="#CFE8FF" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={bowlX - 30 + i * 14} y={bowlY - 8} width="10" height="10" rx="2" fill="#fff" stroke="#3A2D24" strokeWidth="1.5" />
          ))}
          {/* chicken */}
          <g transform={`translate(${pos.x - 30}, ${pos.y - 14})`}>
            <ellipse cx="30" cy="14" rx="30" ry="12" fill="#F1C9A4" stroke="#3A2D24" strokeWidth="2" />
          </g>
          {/* hint */}
          <text x="180" y="350" textAnchor="middle" fontSize="14" fill="#3A2D24" opacity="0.6">
            ↑↓ {Math.round(held)}/500 ms
          </text>
        </svg>
      </div>
    </>
  );
}

// ---------- Step 3: Rice aromatics (rhythm tap) ----------
function AromaticsStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'aromatics', durationMs: 5500, onComplete, dishId: DISH });
  const [hits, setHits] = useState<boolean[]>([false, false, false, false]);
  const [activeBeat, setActiveBeat] = useState(-1);
  const startRef = useRef(performance.now());
  const beatTimes = [800, 1800, 2800, 3800]; // ms from start
  const tolerance = 280; // brief says ±150ms gold; we softer it (forgiving)

  // metronome beat indicator
  useEffect(() => {
    const id = setInterval(() => {
      const t = performance.now() - startRef.current;
      const idx = beatTimes.findIndex((bt) => Math.abs(t - bt) < 150);
      setActiveBeat(idx);
    }, 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining > 0) return;
    const hitCount = hits.filter(Boolean).length;
    const tier: ScoreTier =
      hitCount === 4 ? 'gold' : hitCount === 3 ? 'silver' : hitCount >= 2 ? 'bronze' : 'miss';
    finish(tier, hitCount / 4);
  }, [remaining, hits, finish]);

  const tap = (idx: number) => {
    if (hits[idx]) return;
    const t = performance.now() - startRef.current;
    const expected = beatTimes[idx];
    if (Math.abs(t - expected) < tolerance) {
      sfx.snap();
      setHits((h) => h.map((v, i) => (i === idx ? true : v)));
    } else {
      sfx.error();
    }
  };

  const ingredients = [
    { kind: 'shallot' as const, label: 'shallot' },
    { kind: 'garlic' as const, label: 'garlic' },
    { kind: 'ginger' as const, label: 'ginger' },
    { kind: 'pandan' as const, label: 'pandan' },
  ];
  const t = useT();

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="cr.step3.title"
        stepKeyHint="cr.step3.hint"
        remaining={remaining}
        total={5500}
        mood="tutorial_pointing"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        {/* beat dots */}
        <div className="flex gap-3">
          {beatTimes.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${activeBeat === i ? 'bg-sambal scale-150' : hits[i] ? 'bg-pandan' : 'bg-outline/30'} transition-all`}
            />
          ))}
        </div>
        {/* pan with 4 ingredient tap zones */}
        <div className="grid grid-cols-2 gap-3">
          {ingredients.map((it, i) => (
            <button
              key={i}
              className={`thumb-target w-32 h-32 rounded-[24px] font-bold border-4 shadow-soft grid place-items-center ${hits[i] ? 'bg-pandan/25 border-pandan-shade' : 'bg-white border-outline'}`}
              onClick={() => tap(i)}
              aria-label={`${it.label} beat ${i + 1}`}
            >
              {hits[i] ? (
                <span className="text-4xl text-pandan-shade">✓</span>
              ) : (
                <FoodIconSvg kind={it.kind} size={82} title={it.label} />
              )}
            </button>
          ))}
        </div>
        <div className="text-xs text-outline/60">{t('cr.step3.hint')}</div>
      </div>
    </>
  );
}

// ---------- Step 4: Sauce pestle pound (alternating taps) ----------
function PestleStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'pestle', durationMs: 8000, onComplete, dishId: DISH });
  const [count, setCount] = useState(0);
  const [last, setLast] = useState<'L' | 'R' | null>(null);
  const t = useT();

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = count >= 36 ? 'gold' : count >= 24 ? 'silver' : count >= 12 ? 'bronze' : 'miss';
    finish(tier, count / 40);
  }, [remaining, count, finish]);

  const onTap = (side: 'L' | 'R') => {
    if (last === side) {
      sfx.error();
      return;
    }
    sfx.thud();
    setCount((c) => c + 1);
    setLast(side);
  };

  // paste color shift white -> pale green
  const pct = clamp(count / 40, 0, 1);
  const r = Math.round(255 - (255 - 165) * pct);
  const g = Math.round(255 - (255 - 200) * pct);
  const b = Math.round(255 - (255 - 130) * pct);

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="cr.step4.title"
        stepKeyHint="cr.step4.hint"
        remaining={remaining}
        total={8000}
        mood={count > 24 ? 'cheering' : 'idle'}
        moodValue={pct * 60}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <svg viewBox="0 0 220 200" className="w-[80%] max-w-[420px]">
          {/* pestle */}
          <rect x="100" y="20" width="20" height="80" rx="8" fill="#5A4A42" stroke="#3A2D24" strokeWidth="2" />
          <ellipse cx="110" cy="20" rx="16" ry="8" fill="#5A4A42" stroke="#3A2D24" strokeWidth="2" />
          {/* mortar */}
          <ellipse cx="110" cy="160" rx="80" ry="14" fill="#3A2D24" />
          <ellipse cx="110" cy="156" rx="76" ry="12" fill="#7C6857" />
          {/* paste */}
          <ellipse cx="110" cy="156" rx="60" ry="8" fill={`rgb(${r},${g},${b})`} />
        </svg>
        <div className="text-3xl font-display font-bold mt-2">{count}</div>
        <div className="flex gap-3 mt-3">
          <button
            className={`thumb-target w-32 h-32 rounded-full text-2xl font-bold border-4 ${last === 'L' ? 'bg-kaya border-kaya-shade' : 'bg-white border-outline'}`}
            onClick={() => onTap('L')}
            aria-label="left tap"
          >
            ←
          </button>
          <button
            className={`thumb-target w-32 h-32 rounded-full text-2xl font-bold border-4 ${last === 'R' ? 'bg-kaya border-kaya-shade' : 'bg-white border-outline'}`}
            onClick={() => onTap('R')}
            aria-label="right tap"
          >
            →
          </button>
        </div>
        <div className="text-[11px] text-outline/60 mt-2">{t('cr.step4.hint')}</div>
      </div>
    </>
  );
}

// ---------- Step 5: Plate (drag-snap + paint sauce) ----------
function PlateStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const t = useT();
  const [chicken, setChicken] = useState({ x: 70, y: 320, placed: false });
  const [cucumber, setCucumber] = useState({ x: 230, y: 330, placed: false });
  const [coriander, setCoriander] = useState({ x: 290, y: 330, placed: false });
  const [coverage, setCoverage] = useState(0); // 0..100
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const target = { x: 180, y: 180 }; // viewBox coords (matches the SVG below)
  const finishedRef = useRef(false);
  const lastPaint = useRef<{ x: number; y: number } | null>(null);

  // Sauce paint canvas. We size it to the displayed area in a layout effect so
  // the paint coords map 1:1 with what the user touches.
  const canvasRef = useRef<HTMLCanvasElement>(null);

  usePointer(ref, (e) => {
    // Convert pointer to viewBox coords for placement / proximity checks.
    const vb = clientToSvg(svgRef.current, e.raw.clientX, e.raw.clientY);
    const inPlateRadius = dist(vb.x, vb.y, target.x, target.y) < 100;

    if (e.type === 'down' || e.type === 'move') {
      if (!chicken.placed) {
        setChicken({ x: vb.x, y: vb.y, placed: false });
      } else if (!cucumber.placed) {
        setCucumber({ x: vb.x, y: vb.y, placed: false });
      } else if (!coriander.placed) {
        setCoriander({ x: vb.x, y: vb.y, placed: false });
      } else {
        const cv = canvasRef.current;
        if (cv) {
          const cvP = clientToCanvas(cv, e.raw.clientX, e.raw.clientY);
          // restrict drizzle to the rice area (plate well) — ellipse at (180, 174) rx=78 ry=20
          const dxp = (cvP.x - 180) / 78;
          const dyp = (cvP.y - 174) / 20;
          if (dxp * dxp + dyp * dyp <= 1) {
            const ctx = cv.getContext('2d');
            if (ctx) {
              // narrower drizzle stroke + translucency for a saucy look
              if (lastPaint.current) {
                ctx.strokeStyle = 'rgba(168, 38, 22, 0.85)';
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(lastPaint.current.x, lastPaint.current.y);
                ctx.lineTo(cvP.x, cvP.y);
                ctx.stroke();
              }
              ctx.fillStyle = 'rgba(168, 38, 22, 0.85)';
              ctx.beginPath();
              ctx.arc(cvP.x, cvP.y, 3.5, 0, Math.PI * 2);
              ctx.fill();
              // glossy highlight dot
              ctx.fillStyle = 'rgba(255, 200, 180, 0.45)';
              ctx.beginPath();
              ctx.arc(cvP.x - 1, cvP.y - 1, 1, 0, Math.PI * 2);
              ctx.fill();
              lastPaint.current = { x: cvP.x, y: cvP.y };
            }
          } else {
            lastPaint.current = null;
          }
        }
      }
    }
    if (e.type === 'up') {
      lastPaint.current = null;
      if (!chicken.placed) {
        if (dist(vb.x, vb.y, target.x, target.y) < 80) {
          setChicken({ x: target.x, y: target.y, placed: true });
          sfx.snap();
        } else {
          setChicken({ x: 70, y: 320, placed: false });
        }
      } else if (!cucumber.placed) {
        if (dist(vb.x, vb.y, target.x + 50, target.y + 30) < 80) {
          setCucumber({ x: target.x + 50, y: target.y + 30, placed: true });
          sfx.snap();
        } else {
          setCucumber({ x: 230, y: 330, placed: false });
        }
      } else if (!coriander.placed) {
        if (dist(vb.x, vb.y, target.x - 30, target.y - 40) < 80) {
          setCoriander({ x: target.x - 30, y: target.y - 40, placed: true });
          sfx.snap();
        } else {
          setCoriander({ x: 290, y: 330, placed: false });
        }
      }
    }
  });

  // Periodically compute paint coverage over the rice ellipse area.
  useEffect(() => {
    const id = setInterval(() => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      // rice ellipse is centered at (180, 174) with rx=78, ry=20 in canvas px
      const cx = 180, cy = 174, rx = 78, ry = 20;
      const data = ctx.getImageData(cx - rx, cy - ry, rx * 2, ry * 2).data;
      let painted = 0, total = 0;
      const w = rx * 2;
      for (let i = 0; i < data.length; i += 4) {
        const px = ((i / 4) % w) - rx;
        const py = Math.floor(i / 4 / w) - ry;
        if ((px * px) / (rx * rx) + (py * py) / (ry * ry) > 1) continue;
        total++;
        if (data[i + 3] > 0) painted++;
      }
      setCoverage(total > 0 ? Math.round((painted / total) * 100) : 0);
    }, 200);
    return () => clearInterval(id);
  }, []);

  const allPlaced = chicken.placed && cucumber.placed && coriander.placed;

  const onDone = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // brief: gold = 60–85% sauce coverage; over-saucing penalized
    let sauceTier: ScoreTier;
    if (coverage >= 60 && coverage <= 85) sauceTier = 'gold';
    else if ((coverage >= 40 && coverage < 60) || (coverage > 85 && coverage <= 95)) sauceTier = 'silver';
    else if (coverage > 0) sauceTier = 'bronze';
    else sauceTier = 'miss';
    const garnishCount = (cucumber.placed ? 1 : 0) + (coriander.placed ? 1 : 0);
    // Combined raw: weight sauce 60%, garnish 40%
    const raw = (
      (sauceTier === 'gold' ? 1 : sauceTier === 'silver' ? 0.7 : sauceTier === 'bronze' ? 0.4 : 0) * 0.6 +
      (garnishCount / 2) * 0.4
    );
    const tier: ScoreTier = raw >= 0.85 ? 'gold' : raw >= 0.55 ? 'silver' : raw > 0 ? 'bronze' : 'miss';
    sfx.chime();
    onComplete({ stepId: 'plate', tier, rawScore: raw, durationMs: 0 });
  };

  return (
    <>
      <HUD
        dishId={DISH}
        stepKeyTitle="cr.step5.title"
        stepKeyHint="cr.step5.hint"
        mood={allPlaced ? 'tasting' : 'idle'}
      />
      <div className="absolute inset-0 grid place-items-center pt-28 pb-20 px-2">
        <div ref={ref} className="relative w-full max-w-full max-h-full aspect-[360/460] touch-none">
          {/* Layer 1: plate + rice (under the sauce) */}
          <svg ref={svgRef} viewBox="0 0 360 460" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="plate-fill" cx="0.5" cy="0.4" r="0.7">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="70%" stopColor="#F4ECDC" />
                <stop offset="100%" stopColor="#D9CDB6" />
              </radialGradient>
              <radialGradient id="rice-fill" cx="0.5" cy="0.4" r="0.6">
                <stop offset="0%" stopColor="#FFFCEC" />
                <stop offset="70%" stopColor="#F4E9C7" />
                <stop offset="100%" stopColor="#D8C99B" />
              </radialGradient>
              <pattern id="rice-grain" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <ellipse cx="3" cy="3" rx="1.5" ry="0.6" fill="#C9B97F" opacity="0.55" />
              </pattern>
              <filter id="plate-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="4" />
                <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* table-shadow under plate */}
            <ellipse cx={target.x} cy={target.y + 22} rx="118" ry="14" fill="rgba(58,45,36,0.18)" />
            {/* plate outer ring (rim) */}
            <ellipse cx={target.x} cy={target.y} rx="116" ry="34" fill="#3A2D24" />
            <ellipse cx={target.x} cy={target.y - 2} rx="112" ry="32" fill="url(#plate-fill)" />
            {/* plate well shadow */}
            <ellipse cx={target.x} cy={target.y + 4} rx="92" ry="22" fill="rgba(58,45,36,0.10)" />
            <ellipse cx={target.x} cy={target.y - 2} rx="92" ry="22" fill="url(#plate-fill)" stroke="rgba(58,45,36,0.10)" strokeWidth="1" />
            {/* rice mound */}
            <ellipse cx={target.x} cy={target.y - 6} rx="78" ry="20" fill="url(#rice-fill)" stroke="rgba(58,45,36,0.20)" strokeWidth="1.5" />
            {/* rice grain texture */}
            <ellipse cx={target.x} cy={target.y - 6} rx="78" ry="20" fill="url(#rice-grain)" opacity="0.85" />
            {/* upper rice highlight */}
            <ellipse cx={target.x - 10} cy={target.y - 14} rx="40" ry="6" fill="#FFF7DC" opacity="0.7" />
            {/* placement target ghost */}
            {!chicken.placed && (
              <ellipse cx={target.x} cy={target.y - 4} rx="40" ry="12" fill="none" stroke="#3A2D24" strokeDasharray="4 3" opacity="0.35" />
            )}
            {/* plate top rim highlight */}
            <path d={`M ${target.x - 80} ${target.y - 24} Q ${target.x} ${target.y - 32} ${target.x + 80} ${target.y - 24}`} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />
          </svg>

          {/* Layer 2: sauce paint canvas (between rice and chicken) */}
          <canvas ref={canvasRef} width={360} height={460} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Layer 3: chicken + garnish (over the sauce) */}
          <svg viewBox="0 0 360 460" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="chicken-flesh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBE3BF" />
                <stop offset="55%" stopColor="#F1C9A4" />
                <stop offset="100%" stopColor="#D8AB7C" />
              </linearGradient>
              <linearGradient id="chicken-skin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE9B0" />
                <stop offset="100%" stopColor="#E5C273" />
              </linearGradient>
              <linearGradient id="cucumber-skin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#92C97A" />
                <stop offset="100%" stopColor="#558D40" />
              </linearGradient>
              <radialGradient id="cucumber-flesh" cx="0.5" cy="0.5" r="0.6">
                <stop offset="0%" stopColor="#EFF8DD" />
                <stop offset="100%" stopColor="#C9DFA1" />
              </radialGradient>
            </defs>

            {/* Chicken slice (rendered as a fan of three slices when placed; one when dragging) */}
            {chicken.placed ? (
              <g transform={`translate(${target.x}, ${target.y - 8})`}>
                {/* slice 1 (back) */}
                <g transform="translate(-26, 2) rotate(-6)">
                  <ellipse cx="0" cy="0" rx="28" ry="9" fill="url(#chicken-flesh)" stroke="#7B5A3D" strokeWidth="1.6" />
                  <path d="M -22 -7 Q 0 -10 22 -7 L 22 -3 Q 0 -6 -22 -3 Z" fill="url(#chicken-skin)" stroke="#7B5A3D" strokeWidth="1" />
                </g>
                {/* slice 2 (middle) */}
                <g transform="translate(0, -3) rotate(0)">
                  <ellipse cx="0" cy="0" rx="32" ry="10" fill="url(#chicken-flesh)" stroke="#7B5A3D" strokeWidth="1.8" />
                  <path d="M -26 -8 Q 0 -12 26 -8 L 26 -3 Q 0 -7 -26 -3 Z" fill="url(#chicken-skin)" stroke="#7B5A3D" strokeWidth="1" />
                  <path d="M -18 0 L 18 0" stroke="rgba(123,90,61,0.35)" strokeWidth="1" />
                </g>
                {/* slice 3 (front) */}
                <g transform="translate(28, 2) rotate(8)">
                  <ellipse cx="0" cy="0" rx="28" ry="9" fill="url(#chicken-flesh)" stroke="#7B5A3D" strokeWidth="1.6" />
                  <path d="M -22 -7 Q 0 -10 22 -7 L 22 -3 Q 0 -6 -22 -3 Z" fill="url(#chicken-skin)" stroke="#7B5A3D" strokeWidth="1" />
                </g>
              </g>
            ) : (
              <g transform={`translate(${chicken.x}, ${chicken.y})`}>
                <ellipse cx="0" cy="2" rx="32" ry="10" fill="rgba(58,45,36,0.18)" />
                <ellipse cx="0" cy="0" rx="32" ry="10" fill="url(#chicken-flesh)" stroke="#7B5A3D" strokeWidth="1.8" />
                <path d="M -26 -8 Q 0 -12 26 -8 L 26 -3 Q 0 -7 -26 -3 Z" fill="url(#chicken-skin)" stroke="#7B5A3D" strokeWidth="1" />
              </g>
            )}

            {/* Cucumber slice */}
            <g transform={`translate(${cucumber.x}, ${cucumber.y})`}>
              {!cucumber.placed && <ellipse cx="0" cy="3" rx="16" ry="5" fill="rgba(58,45,36,0.18)" />}
              <circle cx="0" cy="0" r={cucumber.placed ? 11 : 13} fill="url(#cucumber-skin)" stroke="#3A4F23" strokeWidth="1.6" />
              <circle cx="0" cy="0" r={cucumber.placed ? 8 : 10} fill="url(#cucumber-flesh)" stroke="#86A86A" strokeWidth="0.8" />
              {/* seeds */}
              {[0, 1, 2, 3].map((i) => {
                const a = (i / 4) * Math.PI * 2;
                const r = cucumber.placed ? 4 : 5;
                return <ellipse key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} rx="0.9" ry="1.6" fill="#9DBC78" />;
              })}
            </g>

            {/* Coriander leaf (3-lobe) */}
            <g transform={`translate(${coriander.x}, ${coriander.y}) ${coriander.placed ? 'scale(0.85)' : ''}`}>
              {!coriander.placed && <ellipse cx="0" cy="3" rx="9" ry="3" fill="rgba(58,45,36,0.18)" />}
              <path d="M 0 -8 Q -7 -10 -10 -4 Q -8 2 -3 0 Q -7 6 -1 9 Q 5 6 1 0 Q 6 2 8 -4 Q 5 -10 0 -8 Z" fill="#6FB552" stroke="#3A6A22" strokeWidth="1.2" />
              <path d="M 0 -7 L 0 8" stroke="#3A6A22" strokeWidth="0.6" opacity="0.7" />
              <path d="M -6 -2 L 6 -2" stroke="#3A6A22" strokeWidth="0.4" opacity="0.5" />
            </g>

            {/* steam wisps when complete-ish */}
            {allPlaced && (
              <g opacity="0.5">
                <path d="M 150 110 q -6 -16 0 -28 q 6 -8 0 -20" stroke="#3A2D24" strokeWidth="1.5" fill="none" />
                <path d="M 200 100 q 6 -16 0 -28 q -6 -8 0 -22" stroke="#3A2D24" strokeWidth="1.5" fill="none" />
              </g>
            )}
          </svg>

          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
            <div className="text-xs text-outline/70">
              {t('hud.score')}: chicken {chicken.placed ? '✓' : '-'} · cucumber {cucumber.placed ? '✓' : '-'} · coriander {coriander.placed ? '✓' : '-'}
            </div>
            <div className="text-xs text-outline/70">{t('cr.step5.sauce_label', { coverage: String(coverage) })}</div>
          </div>
        </div>
      </div>
      <button
        className="btn-primary absolute bottom-3 left-1/2 -translate-x-1/2"
        onClick={onDone}
      >
        {t('menu.done')}
      </button>
    </>
  );
}

// ---------- Glue ----------
const STEPS = [
  { id: 'poach', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <PoachStep onComplete={onComplete} /> },
  { id: 'ice_bath', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <IceBathStep onComplete={onComplete} /> },
  { id: 'aromatics', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <AromaticsStep onComplete={onComplete} /> },
  { id: 'pestle', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <PestleStep onComplete={onComplete} /> },
  { id: 'plate', render: ({ onComplete }: { onComplete: (r: StepResult) => void }) => <PlateStep onComplete={onComplete} /> },
];

export default function ChickenRice({ onComplete, onExit }: { onComplete: (r: DishResult) => void; onExit: () => void }) {
  return <DishRunner dishId="chicken-rice" steps={STEPS} onComplete={onComplete} onExit={onExit} />;
}
