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
        <svg viewBox="0 0 320 280" className="w-[88%] max-w-[420px]">
          {/* steam */}
          <g opacity="0.5">
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={120 + i * 30} cy={40} r={8 + Math.random() * 4} fill="#fff" stroke="#3A2D24" />
            ))}
          </g>
          {/* pot body */}
          <ellipse cx="160" cy="120" rx="120" ry="20" fill="#3A2D24" />
          <ellipse cx="160" cy="118" rx="118" ry="18" fill={inBand ? '#5FBFB8' : '#8DA9D6'} />
          {/* bubble dots */}
          {inBand &&
            [0, 1, 2, 3, 4].map((i) => (
              <circle
                key={i}
                cx={70 + ((Date.now() / 100 + i * 50) % 180)}
                cy={108 + Math.sin((Date.now() / 200 + i) * 0.5) * 4}
                r={4}
                fill="#fff"
                opacity="0.7"
              />
            ))}
          {/* chicken visible */}
          <ellipse
            cx="160"
            cy="118"
            rx="46"
            ry="10"
            fill={temp > 90 ? '#A89F8A' : temp < 72 ? '#F8C5C0' : '#F1C9A4'}
          />
          {/* pot rim */}
          <rect x="38" y="100" width="244" height="14" rx="6" fill="#3A2D24" />
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

  const labels = ['🧅', '🧄', '🌿', '🌱']; // shallot, garlic, ginger, pandan
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
          {labels.map((lab, i) => (
            <button
              key={i}
              className={`thumb-target w-32 h-32 rounded-full text-4xl font-bold border-4 ${hits[i] ? 'bg-pandan border-pandan-shade' : 'bg-white border-outline'}`}
              onClick={() => tap(i)}
              aria-label={`beat ${i + 1}`}
            >
              {hits[i] ? '✓' : lab}
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
        if (cv && inPlateRadius) {
          const cvP = clientToCanvas(cv, e.raw.clientX, e.raw.clientY);
          const ctx = cv.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#A93521';
            ctx.beginPath();
            ctx.arc(cvP.x, cvP.y, 14, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    if (e.type === 'up') {
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

  // Periodically compute paint coverage.
  useEffect(() => {
    const id = setInterval(() => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const r = 90;
      const data = ctx.getImageData(target.x - r, target.y - r, r * 2, r * 2).data;
      let painted = 0,
        total = 0;
      for (let i = 0; i < data.length; i += 4) {
        const dx = ((i / 4) % (r * 2)) - r;
        const dy = Math.floor(i / 4 / (r * 2)) - r;
        if (dx * dx + dy * dy > r * r) continue;
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
          <svg ref={svgRef} viewBox="0 0 360 460" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* plate */}
            <ellipse cx={target.x} cy={target.y} rx="100" ry="30" fill="#3A2D24" />
            <ellipse cx={target.x} cy={target.y - 4} rx="96" ry="28" fill="#fff" />
            {/* rice */}
            <ellipse cx={target.x} cy={target.y - 8} rx="80" ry="20" fill="#FFF7DC" />
            {/* placement targets ghosts */}
            {!chicken.placed && (
              <ellipse cx={target.x} cy={target.y} rx="40" ry="12" fill="none" stroke="#3A2D24" strokeDasharray="4 3" opacity="0.4" />
            )}
            {/* chicken slices */}
            <g transform={`translate(${chicken.x - 30}, ${chicken.y - 8})`}>
              <ellipse cx="30" cy="8" rx="30" ry="8" fill="#F1C9A4" stroke="#3A2D24" strokeWidth="2" />
              <line x1="14" y1="8" x2="46" y2="8" stroke="#3A2D24" strokeWidth="1" />
            </g>
            <g transform={`translate(${coriander.x - 12}, ${coriander.y - 12})`}>
              <circle cx="12" cy="12" r={coriander.placed ? 8 : 10} fill="#6FB552" stroke="#3A2D24" strokeWidth="2" />
            </g>
            <g transform={`translate(${cucumber.x - 16}, ${cucumber.y - 8})`}>
              <ellipse cx="16" cy="8" rx={cucumber.placed ? 14 : 16} ry={cucumber.placed ? 4 : 6} fill="#6FB55288" stroke="#3A2D24" strokeWidth="2" />
            </g>
          </svg>
          {/* sauce paint canvas overlay — same aspect-fixed wrapper so coords align */}
          <canvas ref={canvasRef} width={360} height={460} className="absolute inset-0 w-full h-full pointer-events-none" />
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
            <div className="text-xs text-outline/70">
              {t('hud.score')}: 🍳 {chicken.placed ? '✓' : '–'} 🥒 {cucumber.placed ? '✓' : '–'} 🌿 {coriander.placed ? '✓' : '–'}
            </div>
            <div className="text-xs text-outline/70">Sauce: {coverage}% (60–85%)</div>
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
