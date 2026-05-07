import { useT } from '../i18n/useT';
import { useApp } from '../state/store';
import type { DishId } from '../types';
import { ChickenRiceHero } from '../art/ChickenRiceHero';
import { pickDaily } from '../game/engine/dailyChallenge';

const base = (import.meta.env.BASE_URL as string) ?? '/';

export function HawkerMap({
  onPickDish,
  onSettings,
  onLeaderboard,
}: {
  onPickDish: (id: DishId) => void;
  onSettings: () => void;
  onLeaderboard: () => void;
}) {
  const t = useT();
  const isUnlocked = useApp((s) => s.isUnlocked);
  const bestStarFor = useApp((s) => s.bestStarFor);
  const dailyDone = useApp((s) => s.dailyDone);
  const daily = pickDaily();
  const dailyUnlocked = isUnlocked(daily.dish);
  const isDailyDone = !!dailyDone[daily.key];
  const spotlightDish: DishId = dailyUnlocked ? daily.dish : 'chicken-rice';

  return (
    <div className="absolute inset-0 overflow-hidden pixel-art">
      <img
        src={`${base}assets/scenes/hawker-map-pixel.webp`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff7d7]/34 via-transparent to-[#2a1a18]/24" />

      <header className="absolute left-3 right-3 top-3 z-10 pixel-panel px-3 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-display font-bold text-outline truncate">{t('map.title')}</h1>
          <p className="text-[10px] text-outline/70 truncate">{t('map.unesco_note')}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-ghost text-[10px] px-2 py-1" onClick={onLeaderboard} aria-label={t('menu.leaderboard')}>
            {t('menu.leaderboard')}
          </button>
          <button className="btn-ghost text-[10px] px-2 py-1" onClick={onSettings} aria-label={t('menu.settings')}>
            {t('menu.settings')}
          </button>
        </div>
      </header>

      <button
        className="absolute left-3 right-3 top-[102px] z-10 pixel-dark-panel px-3 py-2 text-left flex items-center gap-2 thumb-target"
        onClick={() => onPickDish(spotlightDish)}
        aria-label={`${dailyUnlocked ? t('daily.title') : t('menu.start_cooking')} - ${t(`dish.${spotlightDish}.name`)}`}
      >
        <div className="rounded-full border-2 border-[#f5d98e] px-2 py-1 text-[10px] font-black text-[#f5d98e]">
          {dailyUnlocked ? (isDailyDone ? 'DONE' : 'HOT') : 'START'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase font-bold text-[#f5d98e]">
            {dailyUnlocked ? t('daily.title') : t('menu.start_cooking')}
          </div>
          <div className="text-sm font-display font-bold truncate">
            {t(`dish.${spotlightDish}.name`)}
            {dailyUnlocked ? ` - ${t(`daily.mod_${daily.modifier}`)}` : ''}
          </div>
        </div>
        <div className="text-sm font-bold">&gt;</div>
      </button>

      <div className="absolute bottom-16 left-3 right-3 top-[190px] z-10 overflow-hidden">
        <button
          className="surface thumb-target relative flex min-h-[310px] w-full flex-col items-center overflow-hidden px-4 pb-4 pt-2 text-center transition-transform active:translate-y-1"
          onClick={() => onPickDish('chicken-rice')}
          aria-label={t('dish.chicken-rice.name')}
        >
          <div className="absolute inset-x-0 top-0 h-[54%] bg-gradient-to-b from-[#fff9dc] to-[#eecb82]" />
          <div className="relative z-10 w-full">
            <ChickenRiceHero className="mt-1" />
          </div>
          <div className="relative z-10 mt-1 w-full">
            <div className="text-[10px] font-black uppercase text-sambal">{t('menu.start_cooking')}</div>
            <div className="mx-auto mt-1 max-w-[320px] text-3xl font-display font-black leading-none text-outline">
              {t('dish.chicken-rice.name')}
            </div>
            <p className="mx-auto mt-3 max-w-[310px] text-[13px] font-bold leading-snug text-outline/72">
              {t('dish.chicken-rice.hook')}
            </p>
          </div>
          <div className="relative z-10 mt-auto flex w-full items-center justify-between border-t-2 border-outline/15 pt-3 text-[11px] font-black text-outline/65">
            <span>READY</span>
            <span>{'*'.repeat(bestStarFor('chicken-rice'))}{'-'.repeat(3 - bestStarFor('chicken-rice'))}</span>
          </div>
        </button>

        <div className="mt-3 pixel-panel px-4 py-3 text-center text-[12px] font-bold leading-snug text-outline/70">
          One complete dish, tuned for mobile play.
        </div>
      </div>

      <div className="absolute bottom-4 left-3 right-3 z-10 pixel-panel px-3 py-2 text-center text-[11px] text-outline/75">
        {t('dish.chicken-rice.name')} polish build
      </div>
    </div>
  );
}
