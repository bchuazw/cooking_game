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

const DISH = 'chicken-rice';
const ASSET_BASE = (import.meta.env.BASE_URL as string) ?? '/';

// ---------- Step 1: Poach (slider thermometer) ----------
function PoachStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({
    stepId: 'poach',
    durationMs: 12000,
    onComplete,
    dishId: DISH,
  });
  const [temp, setTemp] = useState(80); // C, target 75-85
  const [knob, setKnob] = useState(0.5); // 0..1
  const [holdPct, setHoldPct] = useState(0);
  const drift = useRef(0);
  const inGreen = useRef(0);
  const steady = useRef(0);
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
      // knob 0..1 maps to 65..95 C
      const target = 65 + knob * 30;
      const next = clamp(target - drift.current, 60, 100);
      setTemp(next);
      total.current += dt;
      const inTarget = next >= 75 && next <= 85;
      if (inTarget) {
        inGreen.current += dt;
        steady.current += dt;
      } else {
        steady.current = Math.max(0, steady.current - dt * 1.2);
      }
      setHoldPct(clamp(steady.current / 2600, 0, 1));
      if (steady.current >= 2600 && total.current > 3200) {
        const ratio = total.current > 0 ? inGreen.current / total.current : 0;
        finish(ratio >= 0.75 ? 'gold' : 'silver', ratio);
      }
      // tink on entering band
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [finish, knob]);

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
        <div className="relative mb-16 mr-12 grid w-[260px] place-items-center">
          <div className={`absolute -inset-4 rounded-full ${inBand ? 'bg-[#e8b83a]/25' : temp < 75 ? 'bg-[#7cc7ff]/18' : 'bg-[#d8432b]/18'}`} />
          <img
            src={`${ASSET_BASE}assets/gameplay/poach-pot-620.webp`}
            alt=""
            className={`relative w-full select-none pointer-events-none ${inBand ? 'target-flash' : ''}`}
            draggable={false}
            style={{ imageRendering: 'auto' }}
          />
          <div className="surface absolute -bottom-9 left-1/2 w-56 -translate-x-1/2 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-outline/70">
              <span>{Math.round(temp)}C</span>
              <span>{inBand ? 'PERFECT' : temp < 75 ? 'LOW' : 'HOT'}</span>
            </div>
            <div className="pixel-meter h-[12px] w-full">
              <span style={{ width: `${holdPct * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Thermometer slider */}
        <div className="absolute right-3 top-32 bottom-28 flex flex-col items-center">
          <div ref={ref} className="relative w-12 h-full bg-white border-[4px] border-outline touch-none">
            {/* green band 75-85 in our 65-95 range */}
            <div className="absolute left-0 right-0" style={{
              top: `${((95 - 85) / 30) * 100}%`,
              height: `${(10 / 30) * 100}%`,
              background: '#6FB55244',
              border: '2px dashed #6FB552',
            }} />
            {/* mercury */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 bg-sambal" style={{
              height: `${((temp - 60) / 40) * 100}%`,
              transition: 'height 80ms linear',
            }} />
            {/* knob */}
            <div className="absolute -left-2 -right-2 h-4 bg-outline" style={{
              top: `${(1 - knob) * 100}%`,
              transition: 'top 80ms linear',
            }} />
          </div>
          <div className="mt-1 text-[11px] font-bold" style={{ color: inBand ? '#558D40' : '#A93521' }}>
            {Math.round(temp)}C
          </div>
          <div className="text-[10px] text-outline/70">{t('hud.gold').slice(0, 1)}: 75-85</div>
        </div>
      </div>
    </>
  );
}

// ---------- Step 2: Ice bath (drag chicken) ----------
function IceBathStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const { remaining, finish } = useStep({ stepId: 'ice_bath', onComplete, dishId: DISH, durationMs: 5500 });
  const [pos, setPos] = useState({ x: 112, y: 255 });
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
          <rect x="28" y="286" width="304" height="18" fill="rgba(42,26,24,0.16)" />

          <image
            href={`${ASSET_BASE}assets/gameplay/poach-pot-620.webp`}
            x="28"
            y="166"
            width="150"
            height="126"
            preserveAspectRatio="xMidYMid meet"
            style={{ imageRendering: 'auto' }}
          />

          <g className={overBowl ? 'target-flash' : ''}>
            <ellipse cx={bowlX} cy={bowlY + 62} rx="74" ry="14" fill="rgba(42,26,24,0.18)" />
            <image
              href={`${ASSET_BASE}assets/gameplay/ice-bath-bowl-620.webp`}
              x={bowlX - 88}
              y={bowlY - 56}
              width="176"
              height="110"
              preserveAspectRatio="xMidYMid meet"
              style={{ imageRendering: 'auto' }}
            />
            <ellipse
              cx={bowlX}
              cy={bowlY}
              rx="68"
              ry="45"
              fill="none"
              stroke={overBowl ? '#6FB552' : '#3A2D24'}
              strokeDasharray="7 6"
              strokeWidth="3"
              opacity={overBowl ? 0.9 : 0.32}
            />
          </g>

          <g transform={`translate(${pos.x - 52}, ${pos.y - 38})`} className={overBowl ? 'target-flash' : 'tap-pop'}>
            <ellipse cx="52" cy="57" rx="52" ry="11" fill="rgba(42,26,24,0.18)" />
            <image
              href={`${ASSET_BASE}assets/gameplay/chicken-slices-512.webp`}
              x="0"
              y="0"
              width="104"
              height="74"
              preserveAspectRatio="xMidYMid meet"
              style={{ imageRendering: 'auto' }}
            />
          </g>
          <g transform="translate(110, 326)" opacity="0.78">
            <rect x="0" y="0" width="140" height="24" fill="#fff7d7" stroke="#2a1a18" strokeWidth="3" />
            <rect x="4" y="4" width={Math.min(132, held / 500 * 132)} height="16" fill={overBowl ? '#6fb552' : '#e8b83a'} />
            <text x="70" y="17" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2a1a18">
              {Math.round(held)}/500 ms
            </text>
          </g>
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
    if (!hits.every(Boolean)) return;
    const id = setTimeout(() => finish('gold', 1), 180);
    return () => clearTimeout(id);
  }, [hits, finish]);

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
    { label: 'shallot', asset: 'aromatic-shallot-360.webp', accent: '#c8468c' },
    { label: 'garlic', asset: 'aromatic-garlic-360.webp', accent: '#e6bb52' },
    { label: 'ginger', asset: 'aromatic-ginger-360.webp', accent: '#d88b32' },
    { label: 'pandan', asset: 'aromatic-pandan-360.webp', accent: '#4b9a31' },
  ];
  const t = useT();
  const progress = hits.filter(Boolean).length;

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
      <div className="absolute inset-0 flex flex-col items-center justify-end gap-4 px-4 pb-16 pt-28">
        <div className="relative grid h-28 w-[min(88vw,360px)] place-items-center">
          <div className="absolute bottom-2 h-16 w-72 rounded-full border-[4px] border-outline bg-[#3f332d]" />
          <div className="absolute bottom-5 h-14 w-64 rounded-full bg-gradient-to-b from-[#f7d981] to-[#cf8f35]" />
          <div className="absolute bottom-7 h-9 w-52 rounded-full bg-gradient-to-b from-[#fff2a6] to-[#e3b24a]" />
          {ingredients.map((it, i) => hits[i] && (
            <img
              key={it.label}
              src={`${ASSET_BASE}assets/gameplay/${it.asset}`}
              alt=""
              draggable={false}
              className="absolute select-none pointer-events-none tap-pop"
              style={{
                left: `${72 + i * 58}px`,
                bottom: `${26 + (i % 2) * 8}px`,
                width: i === 3 ? 64 : 58,
                imageRendering: 'auto',
                transform: `rotate(${[-14, 10, -4, 15][i]}deg)`,
              }}
            />
          ))}
          <div className="surface absolute -bottom-4 left-1/2 w-48 -translate-x-1/2 px-3 py-2">
            <div className="mb-1 flex justify-between text-[11px] font-bold text-outline/70">
              <span>BEAT</span>
              <span>{progress}/4</span>
            </div>
            <div className="pixel-meter h-[11px] w-full">
              <span style={{ width: `${progress * 25}%` }} />
            </div>
          </div>
        </div>

        <div className="flex h-6 items-center gap-3">
          {beatTimes.map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 border-outline transition-transform ${activeBeat === i ? 'scale-125 bg-sambal' : hits[i] ? 'bg-pandan' : 'bg-marble'}`}
              style={{ boxShadow: activeBeat === i ? '0 0 0 5px rgba(216,67,43,0.18)' : 'none' }}
            />
          ))}
        </div>

        <div className="grid w-full max-w-[390px] grid-cols-2 gap-3">
          {ingredients.map((it, i) => (
            <button
              key={it.label}
              className={`surface thumb-target relative h-32 overflow-hidden px-2 pb-2 pt-1 font-bold transition-transform ${activeBeat === i ? 'target-flash -translate-y-1' : ''} ${hits[i] ? 'border-pandan-shade' : ''}`}
              onClick={() => tap(i)}
              aria-label={`${it.label} beat ${i + 1}`}
              aria-pressed={hits[i]}
            >
              <div
                className="absolute left-0 right-0 top-0 h-2"
                style={{ background: activeBeat === i || hits[i] ? it.accent : 'rgba(58,45,36,0.16)' }}
              />
              <img
                src={`${ASSET_BASE}assets/gameplay/${it.asset}`}
                alt=""
                draggable={false}
                className={`mx-auto h-[82px] w-full select-none object-contain ${hits[i] ? 'scale-90 opacity-65' : ''}`}
                style={{ imageRendering: 'auto' }}
              />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-black uppercase text-outline/75">
                <span>{it.label}</span>
                <span>{hits[i] ? 'OK' : i + 1}</span>
              </div>
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
    if (count >= 28) {
      finish('gold', 1);
    }
  }, [count, finish]);

  useEffect(() => {
    if (remaining > 0) return;
    const tier: ScoreTier = count >= 28 ? 'gold' : count >= 20 ? 'silver' : count >= 10 ? 'bronze' : 'miss';
    finish(tier, count / 28);
  }, [remaining, count, finish]);

  const onTap = (side: 'L' | 'R') => {
    if (last === side) {
      sfx.error();
      return;
    }
    sfx.thud();
    setCount((c) => Math.min(28, c + 1));
    setLast(side);
  };

  const pct = clamp(count / 28, 0, 1);
  const nextSide = last === 'L' ? 'R' : last === 'R' ? 'L' : null;

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
      <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-16 pt-28">
        <div className="relative grid w-[min(82vw,360px)] place-items-center">
          <div className="absolute bottom-4 h-7 w-64 rounded-full bg-outline/20" />
          <img
            key={count}
            src={`${ASSET_BASE}assets/gameplay/mortar-chili-620.webp`}
            alt=""
            draggable={false}
            className={`relative w-full max-w-[330px] select-none pointer-events-none ${count > 0 ? 'tap-pop' : ''}`}
            style={{
              imageRendering: 'auto',
              transform: last === 'L' ? 'rotate(-1.8deg)' : last === 'R' ? 'rotate(1.8deg)' : 'none',
              transformOrigin: '50% 76%',
            }}
          />
          {count > 0 && count % 4 === 0 && (
            <div className="absolute top-10 rounded-full border-2 border-white/80 bg-sambal/80 px-3 py-1 text-[11px] font-black text-white">
              MIX!
            </div>
          )}
        </div>

        <div className="surface mt-1 w-full max-w-[320px] px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs font-black text-outline/75">
            <span>SAUCE</span>
            <span>{count}/28</span>
          </div>
          <div className="pixel-meter h-[13px] w-full">
            <span style={{ width: `${pct * 100}%` }} />
          </div>
        </div>

        <div className="mt-4 grid w-full max-w-[360px] grid-cols-2 gap-3">
          <button
            className={`surface thumb-target h-24 text-center font-black transition-transform ${nextSide === 'L' ? 'target-flash -translate-y-1' : ''} ${last === 'L' ? 'opacity-65' : ''}`}
            onClick={() => onTap('L')}
            aria-label="left tap"
          >
            <span className="block text-3xl leading-none">L</span>
            <span className="text-[10px] uppercase text-outline/65">left</span>
          </button>
          <button
            className={`surface thumb-target h-24 text-center font-black transition-transform ${nextSide === 'R' ? 'target-flash -translate-y-1' : ''} ${last === 'R' ? 'opacity-65' : ''}`}
            onClick={() => onTap('R')}
            aria-label="right tap"
          >
            <span className="block text-3xl leading-none">R</span>
            <span className="text-[10px] uppercase text-outline/65">right</span>
          </button>
        </div>
        <div className="mt-2 text-[11px] text-outline/60">{t('cr.step4.hint')}</div>
      </div>
    </>
  );
}

// ---------- Step 5: Plate (drag-snap + paint sauce) ----------
function PlateStep({ onComplete }: { onComplete: (r: StepResult) => void }) {
  const t = useT();
  const [chicken, setChicken] = useState({ x: 70, y: 320, placed: false });
  const [garnish, setGarnish] = useState({ x: 250, y: 330, placed: false });
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
      } else if (!garnish.placed) {
        setGarnish({ x: vb.x, y: vb.y, placed: false });
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
      } else if (!garnish.placed) {
        if (dist(vb.x, vb.y, target.x + 50, target.y + 30) < 90) {
          setGarnish({ x: target.x + 50, y: target.y + 26, placed: true });
          sfx.snap();
        } else {
          setGarnish({ x: 250, y: 330, placed: false });
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

  const allPlaced = chicken.placed && garnish.placed;

  const onDone = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // brief: gold = 60–85% sauce coverage; over-saucing penalized
    let sauceTier: ScoreTier;
    if (coverage >= 60 && coverage <= 85) sauceTier = 'gold';
    else if ((coverage >= 40 && coverage < 60) || (coverage > 85 && coverage <= 95)) sauceTier = 'silver';
    else if (coverage > 0) sauceTier = 'bronze';
    else sauceTier = 'miss';
    const garnishCount = garnish.placed ? 2 : 0;
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
          <svg ref={svgRef} viewBox="0 0 360 460" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
            <ellipse cx={target.x} cy={target.y + 34} rx="128" ry="18" fill="rgba(58,45,36,0.18)" />
            <image
              href={`${ASSET_BASE}assets/gameplay/plate-rice-640.webp`}
              x={target.x - 145}
              y={target.y - 70}
              width="290"
              height="139"
              preserveAspectRatio="xMidYMid meet"
              style={{ imageRendering: 'auto' }}
            />
            {!chicken.placed && (
              <ellipse cx={target.x} cy={target.y - 4} rx="56" ry="17" fill="none" stroke="#3A2D24" strokeDasharray="6 5" strokeWidth="2" opacity="0.42" />
            )}
          </svg>

          {/* Layer 2: sauce paint canvas (between rice and chicken) */}
          <canvas ref={canvasRef} width={360} height={460} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Layer 3: chicken + garnish (over the sauce) */}
          <svg viewBox="0 0 360 460" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
            {chicken.placed ? (
              <g>
                <ellipse cx={target.x} cy={target.y + 18} rx="78" ry="16" fill="rgba(58,45,36,0.18)" />
                <image
                  href={`${ASSET_BASE}assets/gameplay/chicken-slices-512.webp`}
                  x={target.x - 76}
                  y={target.y - 61}
                  width="152"
                  height="108"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ imageRendering: 'auto' }}
                />
              </g>
            ) : (
              <g className="tap-pop">
                <ellipse cx={chicken.x} cy={chicken.y + 22} rx="62" ry="13" fill="rgba(58,45,36,0.18)" />
                <image
                  href={`${ASSET_BASE}assets/gameplay/chicken-slices-512.webp`}
                  x={chicken.x - 62}
                  y={chicken.y - 43}
                  width="124"
                  height="88"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ imageRendering: 'auto' }}
                />
              </g>
            )}

            {garnish.placed ? (
              <g>
                <ellipse cx={garnish.x} cy={garnish.y + 17} rx="38" ry="9" fill="rgba(58,45,36,0.16)" />
                <image
                  href={`${ASSET_BASE}assets/gameplay/garnish-320.webp`}
                  x={garnish.x - 48}
                  y={garnish.y - 38}
                  width="96"
                  height="71"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ imageRendering: 'auto' }}
                />
              </g>
            ) : (
              <g className="tap-pop">
                <ellipse cx={garnish.x} cy={garnish.y + 15} rx="34" ry="8" fill="rgba(58,45,36,0.16)" />
                <image
                  href={`${ASSET_BASE}assets/gameplay/garnish-320.webp`}
                  x={garnish.x - 42}
                  y={garnish.y - 34}
                  width="84"
                  height="62"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ imageRendering: 'auto' }}
                />
              </g>
            )}

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
              {t('hud.score')}: chicken {chicken.placed ? '✓' : '-'} · garnish {garnish.placed ? '✓' : '-'}
            </div>
            <div className="text-xs text-outline/70">{t('cr.step5.sauce_label', { coverage: String(coverage) })}</div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 left-0 right-0 z-30 flex justify-center px-4">
        <button className="btn-primary" onClick={onDone}>
          {t('menu.done')}
        </button>
      </div>
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
