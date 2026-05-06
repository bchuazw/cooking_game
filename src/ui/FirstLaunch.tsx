import { useApp } from '../state/store';
import { useT } from '../i18n/useT';
import { PixelAuntie } from '../art/PixelAuntie';
import { say } from '../audio/animalese';
import { useEffect, useState } from 'react';

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
    <div className="absolute inset-0 z-50 bg-marble flex flex-col items-center justify-center p-6 text-center">
      <PixelAuntie mood="tutorial_pointing" size={180} />
      {stage === 'lang' ? (
        <>
          <h2 className="text-2xl font-display font-bold mt-4 mb-2 text-outline">Choose / 言語</h2>
          <div className="flex gap-3 mt-4">
            <button
              className={`btn-ghost thumb-target ${locale === 'ja' ? 'bg-tile-teal text-white' : ''}`}
              onClick={() => {
                setLocale('ja');
                setStage('welcome');
              }}
              aria-pressed={locale === 'ja'}
            >
              日本語
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
          <h2 className="text-xl font-display font-bold mt-4 mb-2 text-outline">{t('first.welcome_title')}</h2>
          <p className="text-base mb-4 max-w-xs">{t('first.welcome_body')}</p>
          <p className="text-sm mb-6 max-w-xs text-outline/70">{t('first.halal_explainer')}</p>
          <button
            className="btn-primary thumb-target"
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
  );
}
