// Generic dish runner. Each dish provides an array of step components; the
// runner collects results and emits the final aggregate.

import { useState, useCallback } from 'react';
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

  const onStep = useCallback(
    (r: StepResult) => {
      setResults((prev) => {
        const next = [...prev, r];
        if (idx + 1 >= steps.length) {
          // dish complete
          const stars = aggregateStars(next) as Stars;
          const totalScore = next.reduce((a, b) => a + tierToScore(b.tier), 0);
          sfx.chime();
          setTimeout(() => {
            onComplete({
              dishId,
              stars,
              steps: next,
              totalScore,
              completedAt: Date.now(),
            });
          }, 250);
        } else {
          setTimeout(() => setIdx((i) => i + 1), 250);
        }
        return next;
      });
    },
    [idx, steps.length, dishId, onComplete],
  );

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
