import { useEffect, useRef } from 'react';
import { AuntieMay } from '../art/AuntieMay';
import { useT } from '../i18n/useT';
import type { DishId } from '../types';
import { track } from '../telemetry';

export function CultureCard({ dishId, onBack }: { dishId: DishId; onBack: () => void }) {
  const t = useT();
  const start = useRef(performance.now());

  useEffect(() => {
    track('culture_card_viewed', { dish_id: dishId });
    return () => {
      track('culture_card_dismissed', {
        dish_id: dishId,
        time_on_card_ms: Math.round(performance.now() - start.current),
      });
    };
  }, [dishId]);

  return (
    <div className="absolute inset-0 bg-marble flex flex-col">
      <header className="px-4 pt-3 pb-2 flex items-center">
        <button className="btn-ghost text-sm py-1 px-3" onClick={onBack}>← {t('menu.back')}</button>
      </header>

      <div className="px-5 pb-5 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 mb-3">
          <AuntieMay mood="culture_card" size={90} />
          <div>
            <h2 className="text-xl font-display font-bold">{t(`dish.${dishId}.name`)}</h2>
            <p className="text-xs text-outline/70">{t(`dish.${dishId}.name_en`)}</p>
          </div>
        </div>

        <div className="surface p-4 mb-4">
          <p className="leading-relaxed">{t(`cc.${dishId}.body`)}</p>
        </div>

        <div className="surface p-4 mb-4 bg-kaya/20">
          <div className="text-xs uppercase tracking-wider text-outline/60 font-bold mb-1">
            {t('culture.did_you_know')}
          </div>
          <p>{t(`cc.${dishId}.didyouknow`)}</p>
        </div>

        <details className="text-xs text-outline/70">
          <summary className="cursor-pointer underline">{t('culture.sources')}</summary>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Roots.gov.sg — Singapore National Heritage Board.</li>
            <li>Singapore Infopedia — eresources.nlb.gov.sg.</li>
            <li>UNESCO Intangible Cultural Heritage — Hawker Culture in Singapore (2020).</li>
            <li>Hutton, W. <i>The Food of Singapore</i>; D'Silva, D. <i>Rempapa</i>.</li>
          </ul>
          <p className="mt-2">
            Per-card cited sources are stored in <code>/content/culture-cards/{dishId}/sources.md</code>.
          </p>
        </details>
      </div>
    </div>
  );
}
