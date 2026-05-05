import { useEffect } from 'react';
import { AuntieMay } from '../art/AuntieMay';
import { useT } from '../i18n/useT';
import { say } from '../audio/animalese';
import type { DishId } from '../types';

export function DishIntro({
  dishId,
  onStart,
  onCulture,
  onBack,
}: {
  dishId: DishId;
  onStart: () => void;
  onCulture: () => void;
  onBack: () => void;
}) {
  const t = useT();
  useEffect(() => {
    void say(t(`dish.${dishId}.hook`));
  }, [dishId, t]);

  return (
    <div className="absolute inset-0 bg-marble flex flex-col">
      <header className="px-4 pt-3 pb-2 flex items-center">
        <button className="btn-ghost text-sm py-1 px-3" onClick={onBack}>← {t('menu.back')}</button>
      </header>

      <div className="flex-1 px-6 flex flex-col items-center justify-center text-center">
        <AuntieMay mood="tutorial_pointing" size={170} />
        <h2 className="text-2xl font-display font-bold text-outline mt-3">
          {t(`dish.${dishId}.name`)}
        </h2>
        <p className="text-sm text-outline/70 mb-4">
          {t(`dish.${dishId}.name_en`)}
        </p>
        <p className="text-base leading-relaxed max-w-xs">
          {t(`dish.${dishId}.hook`)}
        </p>
      </div>

      <div className="px-5 pb-6 space-y-3">
        <button className="btn-primary w-full text-lg" onClick={onStart}>
          {t('menu.start_cooking')}
        </button>
        <button className="btn-ghost w-full text-sm" onClick={onCulture}>
          {t('menu.read_culture_first')}
        </button>
      </div>
    </div>
  );
}
