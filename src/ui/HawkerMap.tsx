import { useT } from '../i18n/useT';
import { useApp, UNLOCK_ORDER } from '../state/store';
import type { DishId } from '../types';
import { Defs, StallCard } from '../art/DishIcons';

interface StallSpec {
  id: DishId;
  x: number;
  y: number;
  iconKey: 'chicken-rice' | 'laksa' | 'prata' | 'chili-crab' | 'kaya-toast';
}

const STALLS: StallSpec[] = [
  { id: 'chicken-rice', x: 14, y: 70, iconKey: 'chicken-rice' },
  { id: 'laksa', x: 200, y: 30, iconKey: 'laksa' },
  { id: 'prata', x: 386, y: 70, iconKey: 'prata' },
  { id: 'chili-crab', x: 96, y: 268, iconKey: 'chili-crab' },
  { id: 'kaya-toast', x: 312, y: 290, iconKey: 'kaya-toast' },
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

  return (
    <div className="absolute inset-0 flex flex-col bg-[#FFF7E8]">
      <header className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-display font-bold text-outline truncate">{t('map.title')}</h1>
          <p className="text-[11px] text-outline/70 truncate">{t('map.unesco_note')}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-ghost text-xs px-2 py-1" onClick={onLeaderboard} aria-label={t('menu.leaderboard')}>★</button>
          <button className="btn-ghost text-xs px-2 py-1" onClick={onSettings} aria-label={t('menu.settings')}>⚙</button>
        </div>
      </header>

      <div className="tile-divider" />

      <div className="relative flex-1 overflow-hidden">
        <svg viewBox="0 0 540 460" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <Defs />
          <defs>
            <pattern id="map-floor" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <rect width="36" height="36" fill="#F4EFE6" />
              <path d="M 0 0 L 36 0 M 0 36 L 36 36" stroke="#E1D6C5" strokeWidth="0.6" />
              <path d="M 0 0 L 0 36 M 36 0 L 36 36" stroke="#E1D6C5" strokeWidth="0.6" />
              <circle cx="18" cy="18" r="0.8" fill="#D8CDB6" opacity="0.6" />
            </pattern>
            <linearGradient id="map-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF7E8" />
              <stop offset="100%" stopColor="#F0E2C7" />
            </linearGradient>
          </defs>

          {/* ambient floor */}
          <rect width="540" height="460" fill="url(#map-bg)" pointerEvents="none" />
          <rect y="200" width="540" height="220" fill="url(#map-floor)" pointerEvents="none" />

          {/* hanging string lights between top stalls */}
          <g stroke="#5A4A42" strokeWidth="1.5" fill="none" pointerEvents="none">
            <path d="M 80 30 q 80 -10 160 0" />
            <path d="M 240 30 q 80 -10 160 0" />
          </g>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const xs = [110, 145, 185, 215, 270, 310, 350, 390];
            return <circle key={i} cx={xs[i]} cy={30 + Math.sin(i) * 4} r="3" fill="#E8B83A" stroke="#7E5C0F" strokeWidth="0.6" pointerEvents="none" />;
          })}

          {/* table cluster centre */}
          <g opacity="0.85" pointerEvents="none">
            <ellipse cx="270" cy="220" rx="62" ry="18" fill="rgba(58,45,36,0.18)" />
            <ellipse cx="270" cy="216" rx="58" ry="16" fill="#fff" stroke="#3A2D24" strokeWidth="1.5" />
            <ellipse cx="270" cy="212" rx="50" ry="12" fill="url(#hm-wood)" />
            <ellipse cx="270" cy="212" rx="50" ry="12" fill="url(#hm-wood-grain)" />
            {/* a chopsticks rest */}
            <rect x="252" y="208" width="36" height="2" fill="#3A2D24" />
            {/* tiny condiment bottles */}
            <g transform="translate(244, 200)">
              <rect x="-3" y="0" width="6" height="10" rx="1" fill="#D8432B" stroke="#3A2D24" strokeWidth="0.6" />
              <rect x="-2" y="-2" width="4" height="2" fill="#3A2D24" />
            </g>
            <g transform="translate(296, 200)">
              <rect x="-3" y="0" width="6" height="10" rx="1" fill="#5A3F26" stroke="#3A2D24" strokeWidth="0.6" />
              <rect x="-2" y="-2" width="4" height="2" fill="#3A2D24" />
            </g>
          </g>

          {/* potted plant accent */}
          <g transform="translate(40, 350)" pointerEvents="none">
            <ellipse cx="0" cy="20" rx="14" ry="3" fill="rgba(58,45,36,0.18)" />
            <path d="M -12 0 L 12 0 L 8 18 L -8 18 Z" fill="#7E5022" stroke="#3A2D24" strokeWidth="1" />
            <ellipse cx="0" cy="-2" rx="10" ry="2" fill="#3A2D24" />
            <path d="M -6 -2 q -2 -10 -8 -14 M 0 -2 q 0 -14 0 -20 M 6 -2 q 2 -10 8 -14" stroke="#558D40" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="-9" cy="-12" rx="4" ry="6" fill="url(#hm-leaf)" stroke="#3A6A22" strokeWidth="0.6" transform="rotate(-25 -9 -12)" />
            <ellipse cx="9" cy="-12" rx="4" ry="6" fill="url(#hm-leaf)" stroke="#3A6A22" strokeWidth="0.6" transform="rotate(25 9 -12)" />
            <ellipse cx="0" cy="-18" rx="4" ry="6" fill="url(#hm-leaf)" stroke="#3A6A22" strokeWidth="0.6" />
          </g>

          {/* stalls */}
          {STALLS.map((s) => {
            const unlocked = isUnlocked(s.id);
            const stars = bestStarFor(s.id);
            return (
              <StallCard
                key={s.id}
                x={s.x}
                y={s.y}
                scale={1}
                swatchColor=""
                unlocked={unlocked}
                stars={stars}
                dishLabel={t(`dish.${s.id}.name`)}
                dishIcon={s.iconKey}
                onClick={() => unlocked && onPickDish(s.id)}
                ariaLabel={`${t(`dish.${s.id}.name`)}${unlocked ? '' : ' ' + t('menu.locked')}`}
              />
            );
          })}
        </svg>

        <div className="absolute bottom-6 left-3 right-3 text-center text-[11px] text-outline/60">
          {(() => {
            const next = UNLOCK_ORDER.find((id) => bestStarFor(id) === 0);
            if (!next) return t('status.unlocks_kaya-toast');
            return `${t('menu.next')}: ${t(`dish.${next}.name`)}`;
          })()}
        </div>
      </div>
    </div>
  );
}
