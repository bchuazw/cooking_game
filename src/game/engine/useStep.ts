// Common hook for a step's lifecycle: timer, completion, score reporting.
// Each dish step is a React component that calls this for plumbing and renders
// its own gesture surface.

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ScoreTier, StepResult } from '../../types';
import { tierToScore } from './scoring';
import { sfx } from '../../audio/audio';
import { track } from '../../telemetry';

export interface UseStepArgs {
  stepId: string;
  durationMs?: number; // optional countdown
  onComplete: (r: StepResult) => void;
  dishId: string;
}

export function useStep({ stepId, durationMs, onComplete, dishId }: UseStepArgs) {
  const [remaining, setRemaining] = useState<number>(durationMs ?? 0);
  const startedAt = useRef<number>(performance.now());
  const finished = useRef(false);

  useEffect(() => {
    if (!durationMs) return;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const rem = Math.max(0, durationMs - elapsed);
      setRemaining(rem);
      if (rem > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);

  const finish = useCallback(
    (tier: ScoreTier, raw?: number) => {
      if (finished.current) return;
      finished.current = true;
      const dur = performance.now() - startedAt.current;
      const result: StepResult = {
        stepId,
        tier,
        rawScore: raw ?? tierToScore(tier),
        durationMs: dur,
      };
      if (tier === 'miss') {
        sfx.error();
        track('step_failed', { dish_id: dishId, step_id: stepId, reason: 'miss' });
      } else {
        sfx.chime();
        track('step_completed', {
          dish_id: dishId,
          step_id: stepId,
          score: tier,
          duration_ms: Math.round(dur),
        });
      }
      onComplete(result);
    },
    [dishId, stepId, onComplete],
  );

  return { remaining, finish, finished: finished.current };
}
