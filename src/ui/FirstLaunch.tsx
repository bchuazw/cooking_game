import { useApp } from '../state/store';
import { useT } from '../i18n/useT';
import { PixelAuntie } from '../art/PixelAuntie';
import { ChickenRiceHero } from '../art/ChickenRiceHero';
import { say } from '../audio/animalese';
import { useEffect, useState } from 'react';

const base = (import.meta.env.BASE_URL as string) ?? '/';

export function FirstLaunch({ onDone }: { onDone: () => void }) {
  const t = useT();
  const setLocale = useApp((s) => s.setLocale);
  const locale = useApp((s) => s.locale);
  const markFirstLaunchSeen = useApp((s) => s.markFirstLaunchSeen);
  const [stage, setStage] = useState<'lang' | 'welcome'>('lang');

  useEffect(() => {
    if (stage === 'welcome') {
      void say(t('first.welcome_body'));
    }
  }, [stage, t]);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-marble text-center">
      <img
        src={`${base}assets/scenes/title-pixel.webp`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-95"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff7d7]/90 via-[#fff7d7]/54 to-[#2a1a18]/18" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-8">
        {stage === 'lang' ? (
          <>
            <div className="surface w-full max-w-sm px-5 py-5">
              <PixelAuntie mood="tutorial_pointing" size={104} className="mx-auto" />
              <h2 className="mt-3 text-3xl font-display font-bold leading-tight text-outline">Choose language</h2>
              <p className="mt-1 text-sm font-bold text-outline/65">Hawker Mama</p>
            </div>
            <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-3">
              <button
                className={`btn-ghost thumb-target ${locale === 'ja' ? 'bg-tile-teal text-white' : ''}`}
                onClick={() => {
                  setLocale('ja');
                  setStage('welcome');
                }}
                aria-pressed={locale === 'ja'}
              >
                Japanese
              </button>
              <button
                className={`btn-ghost thumb-target ${locale === 'en' ? 'bg-tile-teal text-white' : ''}`}
                onClick={() => {
                  setLocale('en');
                  setStage('welcome');
                }}
                aria-pressed={locale === 'en'}
              >
                English
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="surface w-full max-w-sm px-5 py-5">
              <ChickenRiceHero className="mb-2" compact />
              <h2 className="text-2xl font-display font-bold leading-tight text-outline">{t('first.welcome_title')}</h2>
              <p className="mt-3 text-base leading-relaxed text-outline/80">{t('first.welcome_body')}</p>
              <p className="mt-3 text-sm leading-snug text-outline/60">{t('first.halal_explainer')}</p>
            </div>
            <button
              className="btn-primary thumb-target mt-5 w-full max-w-sm"
              onClick={() => {
                markFirstLaunchSeen();
                onDone();
              }}
            >
              {t('first.continue')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
