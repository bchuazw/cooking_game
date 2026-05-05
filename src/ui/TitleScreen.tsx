import { useT } from '../i18n/useT';
import { AuntieMay } from '../art/AuntieMay';
import { say } from '../audio/animalese';
import { useEffect } from 'react';
import { useApp } from '../state/store';

export function TitleScreen({
  onStart,
  onSettings,
  onLeaderboard,
}: {
  onStart: () => void;
  onSettings: () => void;
  onLeaderboard: () => void;
}) {
  const t = useT();
  const locale = useApp((s) => s.locale);
  const setLocale = useApp((s) => s.setLocale);

  useEffect(() => {
    const id = setTimeout(() => void say(t('auntie.welcome')), 400);
    return () => clearTimeout(id);
  }, [t]);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Hawker stall illustration backdrop */}
      <svg viewBox="0 0 480 320" className="w-full h-1/2" preserveAspectRatio="xMidYMid slice">
        <rect width="480" height="320" fill="#F4EFE6" />
        {/* sky / wall */}
        <rect width="480" height="200" fill="#FFF7E8" />
        {/* tile-teal stripe */}
        <rect y="120" width="480" height="14" fill="#2BA59D" />
        <rect y="138" width="480" height="2" fill="#3A2D24" />
        {/* stall counter */}
        <rect y="200" width="480" height="120" fill="#E8B83A" />
        <rect y="200" width="480" height="6" fill="#3A2D24" />
        {/* steam rising */}
        <g fill="none" stroke="#3A2D24" strokeWidth="2" opacity="0.4">
          <path d="M120 110 q-10 -25 0 -45 q10 -10 0 -30" />
          <path d="M150 100 q-8 -22 0 -45 q8 -10 0 -30" />
          <path d="M340 110 q10 -25 0 -45 q-10 -10 0 -30" />
        </g>
        {/* sign */}
        <g transform="translate(120, 30)">
          <rect width="240" height="60" rx="10" fill="#D8432B" stroke="#3A2D24" strokeWidth="3" />
          <text
            x="120"
            y="40"
            textAnchor="middle"
            fontFamily="M PLUS Rounded 1c, sans-serif"
            fontSize="28"
            fontWeight="700"
            fill="#FFF7E8"
          >
            Hawker Mama
          </text>
        </g>
        {/* hanging lanterns (decorative) */}
        <g>
          <line x1="60" y1="0" x2="60" y2="40" stroke="#3A2D24" />
          <ellipse cx="60" cy="55" rx="18" ry="14" fill="#D8432B" stroke="#3A2D24" strokeWidth="2" />
        </g>
        <g>
          <line x1="420" y1="0" x2="420" y2="40" stroke="#3A2D24" />
          <ellipse cx="420" cy="55" rx="18" ry="14" fill="#D8432B" stroke="#3A2D24" strokeWidth="2" />
        </g>
        {/* counter dishes */}
        <g transform="translate(60, 220)">
          <ellipse cx="40" cy="20" rx="36" ry="10" fill="#fff" stroke="#3A2D24" strokeWidth="2" />
          <ellipse cx="40" cy="14" rx="28" ry="6" fill="#F1C9A4" />
        </g>
        <g transform="translate(180, 220)">
          <ellipse cx="40" cy="20" rx="36" ry="10" fill="#fff" stroke="#3A2D24" strokeWidth="2" />
          <ellipse cx="40" cy="14" rx="26" ry="6" fill="#D8432B" />
        </g>
        <g transform="translate(300, 220)">
          <ellipse cx="40" cy="20" rx="36" ry="10" fill="#fff" stroke="#3A2D24" strokeWidth="2" />
          <ellipse cx="40" cy="14" rx="22" ry="6" fill="#E8B83A" />
        </g>
      </svg>

      <div className="tile-divider" />

      <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-6">
        <div className="-mt-24 z-10 drop-shadow-lg">
          <AuntieMay mood="cheering" size={210} />
        </div>
        <h1 className="text-3xl font-display font-bold mt-2 text-outline">{t('app.title')}</h1>
        <p className="text-sm text-outline/70 mb-5">{t('app.tagline')}</p>

        <button className="btn-primary thumb-target text-lg animate-pop" onClick={onStart}>
          {t('menu.tap_to_start')}
        </button>

        <div className="mt-5 flex gap-3">
          <button className="btn-ghost thumb-target text-sm" onClick={onSettings}>
            {t('menu.settings')}
          </button>
          <button className="btn-ghost thumb-target text-sm" onClick={onLeaderboard}>
            {t('menu.leaderboard')}
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-outline/70">
          <span>{t('menu.locale_picker')}:</span>
          <button
            className={`px-2 py-1 rounded ${locale === 'ja' ? 'bg-tile-teal text-white' : ''}`}
            onClick={() => setLocale('ja')}
          >
            JA
          </button>
          <button
            className={`px-2 py-1 rounded ${locale === 'en' ? 'bg-tile-teal text-white' : ''}`}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
}
