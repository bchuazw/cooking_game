import { useState } from 'react';
import { useApp } from '../state/store';
import { useT } from '../i18n/useT';
import { track } from '../telemetry';
import { setMusicVolume, stopAmbience } from '../audio/audio';

export function Settings({ onBack }: { onBack: () => void }) {
  const t = useT();
  const s = useApp();
  const [showPolicy, setShowPolicy] = useState<null | 'privacy' | 'terms' | 'a11y'>(null);

  return (
    <div className="absolute inset-0 bg-marble overflow-y-auto pb-12">
      <header className="sticky top-0 z-10 bg-marble flex items-center px-4 py-3 border-b border-outline/20">
        <button className="btn-ghost text-sm py-1 px-3" onClick={onBack} aria-label={t('menu.back')}>← {t('menu.back')}</button>
        <h2 className="ml-4 text-lg font-display font-bold">{t('settings.title')}</h2>
      </header>

      <div className="p-4 space-y-5">
        <Row label={t('settings.locale')}>
          <div className="flex gap-2">
            <Toggle on={s.locale === 'ja'} onClick={() => s.setLocale('ja')} label="日本語" />
            <Toggle on={s.locale === 'en'} onClick={() => s.setLocale('en')} label="English" />
          </div>
        </Row>

        <Row label={t('settings.halal')} hint={t('settings.halal_help')}>
          <Toggle on={s.halal} onClick={() => { s.setHalal(!s.halal); track('halal_mode_toggled', { enabled: !s.halal }); }} label={s.halal ? '✓' : '○'} />
        </Row>

        <Row label={t('settings.music')}>
          <Slider value={s.music} onChange={(v) => { s.setMusic(v); setMusicVolume(v); }} />
        </Row>
        <Row label={t('settings.sfx')}>
          <Slider value={s.sfx} onChange={(v) => { s.setSfx(v); if (v <= 0.02) stopAmbience(); }} />
        </Row>
        <Row label={t('settings.voice')}>
          <Slider value={s.voice} onChange={s.setVoice} />
        </Row>

        <Row label={t('settings.reduced_motion')}>
          <Toggle on={s.reducedMotion} onClick={() => s.setReducedMotion(!s.reducedMotion)} label={s.reducedMotion ? '✓' : '○'} />
        </Row>
        <Row label={t('settings.describe_step')}>
          <Toggle on={s.describeStep} onClick={() => s.setDescribeStep(!s.describeStep)} label={s.describeStep ? '✓' : '○'} />
        </Row>

        <div className="pt-2 border-t border-outline/20 space-y-2">
          <button className="text-tile-teal-shade underline text-sm" onClick={() => setShowPolicy('privacy')}>{t('settings.privacy')}</button><br />
          <button className="text-tile-teal-shade underline text-sm" onClick={() => setShowPolicy('terms')}>{t('settings.terms')}</button><br />
          <button className="text-tile-teal-shade underline text-sm" onClick={() => setShowPolicy('a11y')}>{t('settings.accessibility')}</button>
          <p className="text-sm mt-2"><span className="text-outline/70">{t('settings.contact')}:</span> {t('policy.contact')}</p>
        </div>

        <div className="pt-3">
          <button
            className="btn-ghost text-sm border-sambal text-sambal"
            onClick={() => {
              if (confirm(t('settings.reset_confirm'))) {
                localStorage.clear();
                location.reload();
              }
            }}
          >
            {t('settings.reset')}
          </button>
        </div>
      </div>

      {showPolicy && (
        <div className="absolute inset-0 bg-marble z-20 p-5 overflow-y-auto">
          <button className="btn-ghost text-sm" onClick={() => setShowPolicy(null)}>← {t('menu.back')}</button>
          <h3 className="mt-3 text-lg font-bold">
            {showPolicy === 'privacy' && t('policy.privacy_title')}
            {showPolicy === 'terms' && t('policy.terms_title')}
            {showPolicy === 'a11y' && t('policy.accessibility_title')}
          </h3>
          <p className="mt-3 leading-relaxed text-sm">
            {showPolicy === 'privacy' && t('policy.privacy_body')}
            {showPolicy === 'terms' && t('policy.terms_body')}
            {showPolicy === 'a11y' && t('policy.accessibility_body')}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-outline/10">
      <div className="flex-1">
        <div className="font-semibold">{label}</div>
        {hint && <div className="text-[11px] text-outline/60 mt-0.5">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      className={`thumb-target px-3 py-1 rounded-chip border-2 border-outline ${on ? 'bg-pandan text-white' : 'bg-white'}`}
      onClick={onClick}
      aria-pressed={on}
    >
      {label}
    </button>
  );
}

function Slider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-32 accent-pandan"
    />
  );
}
