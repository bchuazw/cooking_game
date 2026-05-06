// HUD: timer ring, current step name, mini Auntie May portrait, gesture hint.

import { PixelAuntie } from '../../art/PixelAuntie';
import { useT } from '../../i18n/useT';
import type { AuntieMood, DishId } from '../../types';
import { useApp } from '../../state/store';
import { useEffect } from 'react';

export interface HUDProps {
  dishId: DishId;
  stepKeyTitle: string; // i18n key for title
  stepKeyHint: string; // i18n key for hint
  remaining?: number; // ms
  total?: number; // ms
  mood: AuntieMood;
  moodValue?: number;
  onExit?: () => void;
}

export function HUD({ dishId, stepKeyTitle, stepKeyHint, remaining = 0, total = 0, mood, moodValue, onExit }: HUDProps) {
  const t = useT();
  const describe = useApp((s) => s.describeStep);

  // Push the step description into the aria-live region.
  useEffect(() => {
    if (!describe) return;
    const el = document.getElementById('aria-live');
    if (el) {
      el.textContent = t('aria.step_description', { step: t(stepKeyTitle) });
    }
  }, [describe, stepKeyTitle, t]);

  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const C = 2 * Math.PI * 22;
  const danger = total > 0 && pct > 0 && pct < 0.3;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-start justify-between p-2.5">
        {/* Timer + step title */}
        <div className="surface hud-step-card pointer-events-auto">
          {total > 0 ? (
            <svg className="hud-timer" width="44" height="44" viewBox="0 0 48 48" aria-hidden style={danger ? { animation: 'pulse 0.8s ease-in-out infinite' } : undefined}>
              <circle cx="24" cy="24" r="22" fill="none" stroke="#3A2D2422" strokeWidth="3" />
              <circle
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke={danger ? '#A93521' : '#D8432B'}
                strokeWidth={danger ? 4 : 3}
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
                transform="rotate(-90 24 24)"
              />
            </svg>
          ) : null}
          <div className="leading-tight">
            <div className="text-[10px] text-outline/55">{t('hud.step')}</div>
            <div className="font-bold text-[15px]">{t(stepKeyTitle)}</div>
          </div>
        </div>
        {onExit && (
          <div className="pointer-events-auto">
            <button className="btn-ghost text-xs px-2 py-1" onClick={onExit} aria-label={t('menu.back')}>×</button>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2 px-2.5">
        <div className="surface hud-hint-card pointer-events-auto">
          <p className="text-[13px] leading-snug">{t(stepKeyHint)}</p>
        </div>
        <div className="hud-auntie opacity-95"><PixelAuntie mood={mood} moodValue={moodValue} size={58} /></div>
      </div>

      {/* Hidden context attribute for tests */}
      <span data-dish-id={dishId} className="sr-only" />
    </div>
  );
}
