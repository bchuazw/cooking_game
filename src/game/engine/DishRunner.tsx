// Generic dish runner. Each dish provides an array of step components; the
// runner collects results and emits the final aggregate.

import { useState, useCallback, useEffect } from 'react';
import type { DishId, DishResult, StepResult, Stars } from '../../types';
import { aggregateStars, tierToScore } from './scoring';
import { sfx } from '../../audio/audio';

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

  const onStep = useCallback((r: StepResult) => {
    // Pure setter — no side effects so StrictMode double-invoke is safe.
    setResults((prev) => (prev.length >= steps.length ? prev : [...prev, r]));
  }, [steps.length]);

  // Drive advancement / completion off the results length so side effects only
  // run once per actual step transition.
  useEffect(() => {
    if (results.length === 0) return;
    if (results.length >= steps.length) {
      sfx.chime();
      const t = setTimeout(() => {
        const stars = aggregateStars(results) as Stars;
        const totalScore = results.reduce((a, b) => a + tierToScore(b.tier), 0);
        onComplete({
          dishId,
          stars,
          steps: results,
          totalScore,
          completedAt: Date.now(),
        });
      }, 250);
      return () => clearTimeout(t);
    }
    if (results.length > idx) {
      const t = setTimeout(() => setIdx(results.length), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [results, idx, steps.length, dishId, onComplete]);

  const cur = steps[idx];

  return (
    <div className="absolute inset-0 bg-marble select-none">
      {cur.render({ onComplete: onStep })}
      <button
        className="btn-ghost text-xs absolute bottom-2 right-2 z-30 px-2 py-1 opacity-50"
        onClick={onExit}
        aria-label="exit"
      >
        ⏏
      </button>
    </div>
  );
}
