import { useEffect } from 'react';
import { AuntieMay } from '../art/AuntieMay';
import { useT } from '../i18n/useT';
import type { DishResult } from '../types';
import { say } from '../audio/animalese';
import { sfx } from '../audio/audio';
import { track } from '../telemetry';

export function DishComplete({
  result,
  onReadCulture,
  onNext,
  onReplay,
}: {
  result: DishResult;
  onReadCulture: () => void;
  onNext: () => void;
  onReplay: () => void;
}) {
  const t = useT();

  useEffect(() => {
    sfx.star(result.stars === 0 ? 1 : (result.stars as 1 | 2 | 3));
    void say(t(`auntie.complete_${Math.max(1, result.stars)}`));
  }, [result.stars, t]);

  const mood = result.stars >= 3 ? 'dish_perfect' : 'cheering';

  const onShare = async () => {
    const text = t('complete.share_text', { dish: t(`dish.${result.dishId}.name`) });
    track('share_card_generated', { dish_id: result.dishId });
    if (navigator.share) {
      try {
        await navigator.share({ title: t('app.title'), text });
        return;
      } catch {/* cancelled */}
    }
    try {
      await navigator.clipboard.writeText(text);
      alert(t('menu.share') + ' ✓');
    } catch {/* */}
  };

  return (
    <div className="absolute inset-0 bg-marble flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <AuntieMay mood={mood} size={180} />
        <h2 className="text-2xl font-display font-bold mt-3">{t('complete.title')}</h2>
        <p className="text-3xl font-display font-bold mt-2 text-kaya-shade">
          {t(`complete.stars_${Math.max(1, result.stars)}`)}
        </p>

        <div className="surface p-3 mt-5 w-full max-w-xs">
          <div className="text-xs text-outline/70 mb-1">{t(`dish.${result.dishId}.name`)}</div>
          <ul className="text-sm space-y-1">
            {result.steps.map((s) => (
              <li key={s.stepId} className="flex justify-between">
                <span>{s.stepId}</span>
                <span className="text-outline/70">{t(`hud.${s.tier}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="px-5 pb-6 space-y-2">
        <button className="btn-primary w-full" onClick={onReadCulture}>{t('menu.read_culture')}</button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={onReplay}>{t('menu.replay')}</button>
          <button className="btn-ghost" onClick={onShare}>{t('menu.share')}</button>
        </div>
        <button className="btn-ghost w-full" onClick={onNext}>{t('menu.next_dish')}</button>
      </div>
    </div>
  );
}
