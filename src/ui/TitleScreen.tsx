import { useEffect } from 'react';
import { PixelAuntie } from '../art/PixelAuntie';
import { say } from '../audio/animalese';
import { useT } from '../i18n/useT';
import { useApp } from '../state/store';

const base = (import.meta.env.BASE_URL as string) ?? '/';

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
    <div className="absolute inset-0 overflow-hidden pixel-art">
      <img
        src={`${base}assets/scenes/title-pixel.webp`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#162b33]/25 via-transparent to-[#2a1a18]/30" />

      <div className="absolute inset-x-4 top-8 pixel-dark-panel px-4 py-4 text-center">
        <h1 className="text-[34px] leading-none font-display font-bold text-[#fff7d7]">
          {t('app.title')}
        </h1>
        <p className="mt-2 text-xs font-bold text-[#f5d98e]">{t('app.tagline')}</p>
      </div>

      <div className="absolute inset-x-0 bottom-7 flex flex-col items-center px-6">
        <div className="mb-3 pixel-panel px-3 pt-3 pb-1">
          <PixelAuntie mood="cheering" size={132} />
        </div>

        <button className="btn-primary thumb-target w-full max-w-xs text-lg animate-pop" onClick={onStart}>
          {t('menu.tap_to_start')}
        </button>

        <div className="mt-4 grid w-full max-w-xs grid-cols-2 gap-3">
          <button className="btn-ghost thumb-target text-sm" onClick={onSettings}>
            {t('menu.settings')}
          </button>
          <button className="btn-ghost thumb-target text-sm" onClick={onLeaderboard}>
            {t('menu.leaderboard')}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 pixel-panel px-3 py-2 text-xs text-outline">
          <span>{t('menu.locale_picker')}:</span>
          <button
            className={`px-2 py-1 border-2 border-outline ${locale === 'ja' ? 'bg-tile-teal text-white' : 'bg-marble'}`}
            onClick={() => setLocale('ja')}
          >
            JA
          </button>
          <button
            className={`px-2 py-1 border-2 border-outline ${locale === 'en' ? 'bg-tile-teal text-white' : 'bg-marble'}`}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
}
