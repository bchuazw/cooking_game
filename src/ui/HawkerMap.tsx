import { useT } from '../i18n/useT';
import { useApp, UNLOCK_ORDER } from '../state/store';
import type { DishId } from '../types';
import { PixelIconSvg, type PixelFoodKind } from '../art/PixelFood';
import { pickDaily } from '../game/engine/dailyChallenge';

const base = (import.meta.env.BASE_URL as string) ?? '/';

interface StallSpec {
  id: DishId;
  left: string;
  top: string;
  icon: PixelFoodKind;
}

const STALLS: StallSpec[] = [
  { id: 'chicken-rice', left: '25%', top: '36%', icon: 'chickenSlice' },
  { id: 'laksa', left: '71%', top: '34%', icon: 'noodle' },
  { id: 'prata', left: '24%', top: '62%', icon: 'prata' },
  { id: 'chili-crab', left: '73%', top: '61%', icon: 'crab' },
  { id: 'kaya-toast', left: '50%', top: '78%', icon: 'kayaToast' },
];

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
  const isDailyDone = !!dailyDone[daily.key];

  return (
    <div className="absolute inset-0 overflow-hidden pixel-art">
      <img
        src={`${base}assets/scenes/hawker-map-pixel.webp`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff7d7]/20 via-transparent to-[#2a1a18]/20" />

      <header className="absolute left-3 right-3 top-3 z-10 pixel-panel px-3 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-display font-bold text-outline truncate">{t('map.title')}</h1>
          <p className="text-[10px] text-outline/70 truncate">{t('map.unesco_note')}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-ghost text-xs px-2 py-1" onClick={onLeaderboard} aria-label={t('menu.leaderboard')}>★</button>
          <button className="btn-ghost text-xs px-2 py-1" onClick={onSettings} aria-label={t('menu.settings')}>⚙</button>
        </div>
      </header>

      <button
        className="absolute left-3 right-3 top-[102px] z-10 pixel-dark-panel px-3 py-2 text-left flex items-center gap-2 thumb-target"
        onClick={() => isUnlocked(daily.dish) && onPickDish(daily.dish)}
        aria-label={`${t('daily.title')} - ${t(`dish.${daily.dish}.name`)}`}
      >
        <div className="text-xl">{isDailyDone ? '★' : '🔥'}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase font-bold text-[#f5d98e]">{t('daily.title')}</div>
          <div className="text-sm font-display font-bold truncate">{t(`dish.${daily.dish}.name`)} · {t(`daily.mod_${daily.modifier}`)}</div>
        </div>
        <div className="text-sm font-bold">{isDailyDone ? '✓' : '→'}</div>
      </button>

      {STALLS.map((stall) => {
        const unlocked = isUnlocked(stall.id);
        const stars = bestStarFor(stall.id);
        return (
          <button
            key={stall.id}
            className="pixel-stall thumb-target z-10"
            style={{ left: stall.left, top: stall.top }}
            disabled={!unlocked}
            onClick={() => unlocked && onPickDish(stall.id)}
            aria-label={`${t(`dish.${stall.id}.name`)}${unlocked ? '' : ' ' + t('menu.locked')}`}
          >
            <div className="mx-auto mb-1 w-fit">
              <PixelIconSvg kind={stall.icon} size={46} title={t(`dish.${stall.id}.name`)} />
            </div>
            <div className="min-h-[24px] overflow-hidden text-[10px] leading-tight font-bold text-outline">
              {t(`dish.${stall.id}.name`)}
            </div>
            <div className="mt-1 text-[11px] leading-none text-kaya-shade">
              {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
            </div>
          </button>
        );
      })}

      <div className="absolute bottom-4 left-3 right-3 z-10 pixel-panel px-3 py-2 text-center text-[11px] text-outline/75">
        {(() => {
          const next = UNLOCK_ORDER.find((id) => bestStarFor(id) === 0);
          if (!next) return t('status.unlocks_kaya-toast');
          return `${t('menu.next')}: ${t(`dish.${next}.name`)}`;
        })()}
      </div>
    </div>
  );
}
