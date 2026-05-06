// Generic dish runner. Each dish provides an array of step components; the
// runner collects results and emits the final aggregate.

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { DishId, DishResult, StepResult, Stars } from '../../types';
import { aggregateStars, tierToScore } from './scoring';
import { sfx } from '../../audio/audio';
import { emitBurst, emitFloat, shake } from '../../feel/feel';
import { haptics } from '../../feel/haptics';
import { ComboBadge } from './Combo';
import { DishBackplate } from '../../art/Backplates';

export interface StepProps {
  onComplete: (r: StepResult) => void;
}

export function DishRunner({
  dishId,
  steps,
  onComplete,
  onExit,
}: {
  dishId: DishId;
  steps: { id: string; render: (props: StepProps) => React.ReactNode }[];
  onComplete: (r: DishResult) => void;
  onExit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<StepResult[]>([]);
  const [combo, setCombo] = useState(0);
  const maxCombo = useMemo(() => results.reduce<{ cur: number; max: number }>((a, r) => {
    const cur = (r.tier === 'gold' || r.tier === 'silver') ? a.cur + 1 : 0;
    return { cur, max: Math.max(a.max, cur) };
  }, { cur: 0, max: 0 }).max, [results]);

  const onStep = useCallback((r: StepResult) => {
    // Pure setter — no side effects.
    setResults((prev) => (prev.length >= steps.length ? prev : [...prev, r]));
  }, [steps.length]);

  // Side effects: feedback per step.
  useEffect(() => {
    if (results.length === 0) return;
    const last = results[results.length - 1];
    const w = window.innerWidth, h = window.innerHeight;
    const cx = w / 2, cy = h * 0.42;

    if (last.tier === 'gold') {
      emitBurst(cx, cy, { color: '#E8B83A', count: 28, speed: 5, gravity: 0.18 });
      emitBurst(cx, cy, { color: '#FFE9A0', count: 14, speed: 3, gravity: 0.15 });
      emitFloat(cx, cy - 30, 'GOLD!', '#E8B83A', 32);
      shake(6, 240);
      haptics.success();
      sfx.combo(Math.min(5, combo + 1));
      setCombo((c) => c + 1);
    } else if (last.tier === 'silver') {
      emitBurst(cx, cy, { color: '#C0C0C0', count: 16, speed: 3.5, gravity: 0.16 });
      emitFloat(cx, cy - 30, 'SILVER', '#C0C0C0', 26);
      shake(3, 180);
      haptics.snap();
      sfx.chime();
      setCombo((c) => c + 1);
    } else if (last.tier === 'bronze') {
      emitBurst(cx, cy, { color: '#C58B5A', count: 10, speed: 2.5, gravity: 0.18 });
      emitFloat(cx, cy - 30, 'BRONZE', '#C58B5A', 22);
      haptics.tap();
      setCombo(0);
    } else {
      emitFloat(cx, cy - 30, 'MISS', '#7a7a7a', 22);
      haptics.error();
      setCombo(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length]);

  // Drive advancement / completion off the results length so side effects only
  // run once per actual step transition.
  useEffect(() => {
    if (results.length === 0) return;
    if (results.length >= steps.length) {
      const t = setTimeout(() => {
        const stars = aggregateStars(results) as Stars;
        const totalScore = results.reduce((a, b) => a + tierToScore(b.tier), 0);
        // Big finale feedback
        const w = window.innerWidth, h = window.innerHeight;
        emitBurst(w / 2, h / 2, { color: '#E8B83A', count: 50, speed: 7, gravity: 0.18, life: 1200 });
        emitBurst(w / 2, h / 2, { color: '#D8432B', count: 30, speed: 5, gravity: 0.18, life: 1200 });
        emitBurst(w / 2, h / 2, { color: '#6FB552', count: 20, speed: 4, gravity: 0.18, life: 1200 });
        shake(stars >= 3 ? 10 : 6, 400);
        haptics.star((stars || 1) as 1 | 2 | 3);
        sfx.star((stars || 1) as 1 | 2 | 3);
        onComplete({
          dishId,
          stars,
          steps: results,
          totalScore,
          completedAt: Date.now(),
          maxCombo,
        });
      }, 700);
      return () => clearTimeout(t);
    }
    if (results.length > idx) {
      const t = setTimeout(() => setIdx(results.length), 520);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [results, idx, steps.length, dishId, onComplete, maxCombo]);

  const cur = steps[idx];
  const pendingResult = results.length > idx ? results[results.length - 1] : null;
  const stepNumber = Math.min(idx + 1, steps.length);

  return (
    <div className="absolute inset-0 select-none pixel-art">
      <DishBackplate dishId={dishId} />
      <div className="dish-progress pointer-events-none absolute bottom-2 left-2 z-30">
        {steps.map((step, i) => (
          <span
            key={step.id}
            className={`dish-progress-pip ${i < results.length ? 'is-done' : i === idx ? 'is-active' : ''}`}
          />
        ))}
      </div>
      <div key={cur.id} className="dish-step-enter absolute inset-0">
        {cur.render({ onComplete: onStep })}
      </div>
      <div key={`cue-${cur.id}`} className="step-start-cue pointer-events-none absolute inset-0 z-40 grid place-items-center">
        <div className="pixel-panel step-start-card">
          <span>STEP {stepNumber}</span>
          <strong>GO!</strong>
        </div>
      </div>
      {pendingResult && (
        <div
          key={`grade-${results.length}-${pendingResult.stepId}-${pendingResult.tier}`}
          className={`grade-slam pointer-events-none absolute inset-0 z-40 grid place-items-center grade-${pendingResult.tier}`}
        >
          <div className="pixel-panel grade-card">
            <span>{pendingResult.tier.toUpperCase()}</span>
          </div>
        </div>
      )}
      <ComboBadge combo={combo} />
      <button
        className="btn-ghost text-xs absolute bottom-2 right-2 z-30 px-2 py-1 opacity-50"
        onClick={onExit}
        aria-label="exit"
      >
        X
      </button>
    </div>
  );
}
