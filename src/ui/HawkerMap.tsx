import { useT } from '../i18n/useT';
import { useApp, UNLOCK_ORDER } from '../state/store';
import type { DishId } from '../types';

interface StallSpec {
  id: DishId;
  x: number;
  y: number;
  swatch: string; // accent color
  emoji: string; // line-icon proxy via emoji-shape (no emoji font dependency)
}

const STALLS: StallSpec[] = [
  { id: 'chicken-rice', x: 60, y: 90, swatch: '#E8B83A', emoji: '🍗' },
  { id: 'laksa', x: 200, y: 70, swatch: '#D8432B', emoji: '🍜' },
  { id: 'prata', x: 340, y: 100, swatch: '#F1C9A4', emoji: '🫓' },
  { id: 'chili-crab', x: 110, y: 220, swatch: '#D8432B', emoji: '🦀' },
  { id: 'kaya-toast', x: 280, y: 240, swatch: '#6FB552', emoji: '🍞' },
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
        {/* Hawker centre top-down map: tiled floor + stalls */}
        <svg viewBox="0 0 480 380" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="floor" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="#F4EFE6" />
              <rect x="0" y="0" width="32" height="32" fill="none" stroke="#E1D6C5" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="480" height="380" fill="url(#floor)" />

          {/* Centre tables */}
          <g opacity="0.6">
            <ellipse cx="240" cy="170" rx="44" ry="22" fill="#fff" stroke="#3A2D24" strokeWidth="2" />
            <ellipse cx="240" cy="170" rx="32" ry="14" fill="#F1C9A4" />
          </g>

          {/* Stalls */}
          {STALLS.map((s) => {
            const unlocked = isUnlocked(s.id);
            const stars = bestStarFor(s.id);
            return (
              <g
                key={s.id}
                transform={`translate(${s.x}, ${s.y})`}
                style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
                onClick={() => unlocked && onPickDish(s.id)}
                role="button"
                aria-label={`${t(`dish.${s.id}.name`)} ${unlocked ? '' : t('menu.locked')}`}
                tabIndex={unlocked ? 0 : -1}
              >
                {/* stall body */}
                <rect width="100" height="80" rx="10" fill={unlocked ? s.swatch : '#D9D2CC'} stroke="#3A2D24" strokeWidth="3" />
                {/* awning */}
                <path d="M-4 -4 L104 -4 L94 18 L6 18 Z" fill="#D8432B" stroke="#3A2D24" strokeWidth="2" opacity={unlocked ? 1 : 0.4} />
                <path d="M16 -4 L16 18 M40 -4 L40 18 M64 -4 L64 18 M88 -4 L88 18" stroke="#FFF7E8" strokeWidth="2" opacity={unlocked ? 1 : 0.5} />
                {/* counter */}
                <rect x="0" y="60" width="100" height="20" fill="#FFF7E8" stroke="#3A2D24" strokeWidth="2" />
                {/* dish swatch */}
                <text x="50" y="50" fontSize="34" textAnchor="middle">{s.emoji}</text>
                {/* sign */}
                <text x="50" y="75" fontSize="11" fontWeight="700" fontFamily="M PLUS Rounded 1c, sans-serif" textAnchor="middle" fill="#3A2D24">
                  {t(`dish.${s.id}.name`)}
                </text>
                {/* stars */}
                {[1, 2, 3].map((i) => (
                  <circle
                    key={i}
                    cx={20 + i * 15}
                    cy={-12}
                    r={5}
                    fill={i <= stars ? '#E8B83A' : 'transparent'}
                    stroke="#3A2D24"
                    strokeWidth="1.5"
                  />
                ))}
                {!unlocked && (
                  <g>
                    <circle cx="50" cy="40" r="14" fill="rgba(0,0,0,0.4)" />
                    <text x="50" y="45" fontSize="14" textAnchor="middle" fill="white">🔒</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Unlock-order hint */}
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
