import { useT } from '../i18n/useT';
import { AuntieMay } from '../art/AuntieMay';
import { say } from '../audio/animalese';
import { useEffect } from 'react';
import { useApp } from '../state/store';
import { Defs, ChickenRiceIcon, LaksaIcon, KayaToastIcon } from '../art/DishIcons';

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
        <Defs />
        <defs>
          <linearGradient id="title-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE7BD" />
            <stop offset="100%" stopColor="#FFF7E8" />
          </linearGradient>
          <linearGradient id="title-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBE7B6" />
            <stop offset="100%" stopColor="#E0BD7A" />
          </linearGradient>
          <radialGradient id="title-lantern" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#FFB870" />
            <stop offset="60%" stopColor="#D8432B" />
            <stop offset="100%" stopColor="#7E2113" />
          </radialGradient>
          <radialGradient id="title-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(255,200,120,0.6)" />
            <stop offset="100%" stopColor="rgba(255,200,120,0)" />
          </radialGradient>
          <pattern id="title-tiles" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <rect width="22" height="22" fill="#2BA59D" />
            <path d="M 11 2 L 20 11 L 11 20 L 2 11 Z" fill="#FFD9A0" opacity="0.6" />
            <path d="M 11 6 L 16 11 L 11 16 L 6 11 Z" fill="#7E2113" opacity="0.4" />
          </pattern>
        </defs>

        {/* sky */}
        <rect width="480" height="200" fill="url(#title-sky)" />
        {/* wall */}
        <rect width="480" height="80" y="140" fill="url(#title-wall)" />
        {/* lantern glow halos */}
        <circle cx="60" cy="55" r="46" fill="url(#title-glow)" />
        <circle cx="420" cy="55" r="46" fill="url(#title-glow)" />
        <circle cx="240" cy="60" r="60" fill="url(#title-glow)" />

        {/* peranakan tile band */}
        <rect y="120" width="480" height="22" fill="url(#title-tiles)" />
        <rect y="120" width="480" height="2" fill="#3A2D24" />
        <rect y="142" width="480" height="2" fill="#3A2D24" />

        {/* stall counter (wooden) */}
        <rect y="200" width="480" height="120" fill="url(#hm-wood)" />
        <rect y="200" width="480" height="120" fill="url(#hm-wood-grain)" />
        <rect y="200" width="480" height="3" fill="#3A2D24" />
        <rect y="318" width="480" height="2" fill="#3A2D24" />
        {/* counter front edge highlight */}
        <rect y="204" width="480" height="2" fill="rgba(255,255,255,0.35)" />

        {/* steam rising */}
        <g fill="none" stroke="#3A2D24" strokeWidth="2" opacity="0.35">
          <path d="M120 200 q-10 -25 0 -45 q10 -10 0 -30" />
          <path d="M150 195 q-8 -22 0 -45 q8 -10 0 -30" />
          <path d="M340 205 q10 -25 0 -45 q-10 -10 0 -30" />
          <path d="M370 200 q8 -22 0 -45 q-8 -10 0 -30" />
        </g>

        {/* big sambal-red sign with bevel */}
        <g transform="translate(120, 26)">
          <rect width="240" height="68" rx="12" fill="#7E2113" />
          <rect width="240" height="64" rx="11" fill="#D8432B" stroke="#3A2D24" strokeWidth="3" />
          <rect x="6" y="6" width="228" height="14" rx="6" fill="rgba(255,255,255,0.18)" />
          <text x="120" y="44" textAnchor="middle" fontFamily="M PLUS Rounded 1c, sans-serif" fontSize="30" fontWeight="700" fill="#FFF7E8">
            Hawker Mama
          </text>
          {/* JA accent */}
          <text x="120" y="58" textAnchor="middle" fontFamily="Noto Sans JP, sans-serif" fontSize="9" fill="#FFD9A0">
            ホーカーマ
          </text>
        </g>

        {/* hanging lanterns with tassels */}
        {[60, 420].map((cx) => (
          <g key={cx}>
            <line x1={cx} y1="0" x2={cx} y2="32" stroke="#3A2D24" strokeWidth="1.2" />
            <ellipse cx={cx} cy="55" rx="20" ry="16" fill="url(#title-lantern)" stroke="#3A2D24" strokeWidth="2" />
            <path d={`M ${cx - 18} 55 Q ${cx} 60 ${cx + 18} 55`} stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
            <ellipse cx={cx} cy="42" rx="14" ry="3" fill="rgba(0,0,0,0.2)" />
            <line x1={cx} y1="71" x2={cx} y2="80" stroke="#3A2D24" strokeWidth="1.2" />
            {/* tassel */}
            {[-3, 0, 3].map((dx) => (
              <line key={dx} x1={cx + dx} y1="80" x2={cx + dx} y2="92" stroke="#7E2113" strokeWidth="1" />
            ))}
            {/* lantern text */}
            <text x={cx} y="60" textAnchor="middle" fontFamily="Noto Sans JP" fontSize="10" fontWeight="700" fill="#FFD9A0">福</text>
          </g>
        ))}

        {/* counter dishes — real mini illustrations */}
        <g transform="translate(40, 200) scale(1.2)">
          <ChickenRiceIcon />
        </g>
        <g transform="translate(192, 198) scale(1.3)">
          <LaksaIcon />
        </g>
        <g transform="translate(348, 200) scale(1.2)">
          <KayaToastIcon />
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
