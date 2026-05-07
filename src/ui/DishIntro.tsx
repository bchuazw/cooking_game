import { useEffect } from 'react';
import { DishBackplate } from '../art/Backplates';
import { PixelAuntie } from '../art/PixelAuntie';
import { ChickenRiceHero } from '../art/ChickenRiceHero';
import { LaksaHero } from '../art/LaksaHero';
import { PrataHero } from '../art/PrataHero';
import { say } from '../audio/animalese';
import { useT } from '../i18n/useT';
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
  const isChickenRice = dishId === 'chicken-rice';
  const isLaksa = dishId === 'laksa';
  const isPrata = dishId === 'prata';
  const dishName = t(`dish.${dishId}.name`);
  const dishNameEn = t(`dish.${dishId}.name_en`);
  useEffect(() => {
    void say(t(`dish.${dishId}.hook`));
  }, [dishId, t]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden pixel-art">
      <DishBackplate dishId={dishId} wash={0.36} />
      <header className="relative z-10 px-4 pt-3 pb-2 flex items-center">
        <button className="btn-ghost text-sm py-1 px-3" onClick={onBack}>{'<'} {t('menu.back')}</button>
      </header>

      <div className="relative z-10 flex-1 px-6 flex flex-col items-center justify-center text-center">
        <div className="surface w-full max-w-sm px-5 py-5">
          {isChickenRice ? (
            <ChickenRiceHero className="mb-2" />
          ) : isLaksa ? (
            <LaksaHero className="mb-2" />
          ) : isPrata ? (
            <PrataHero className="mb-2" />
          ) : (
            <PixelAuntie mood="tutorial_pointing" size={128} className="mx-auto" />
          )}
          <h2 className="text-2xl font-display font-bold text-outline mt-3">
            {dishName}
          </h2>
          {dishNameEn !== dishName && (
            <p className="text-sm text-outline/70 mb-4">
              {dishNameEn}
            </p>
          )}
          <p className="text-base leading-relaxed max-w-xs">
            {t(`dish.${dishId}.hook`)}
          </p>
        </div>
      </div>

      <div className="relative z-10 px-5 pb-6 space-y-3">
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
